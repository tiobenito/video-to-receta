"""Whisper transcription service using OpenAI API."""

import os
import tempfile
from pathlib import Path

import yt_dlp
from openai import OpenAI

from app.core.config import settings


class WhisperError(Exception):
    """Error during Whisper transcription."""
    pass


def download_audio(video_id: str) -> str:
    """
    Download audio from YouTube video using yt-dlp.

    Args:
        video_id: YouTube video ID

    Returns:
        Path to downloaded audio file

    Raises:
        WhisperError: If download fails
    """
    # Create temp directory for audio
    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, f"{video_id}.mp3")

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '64',  # Lower quality = smaller file = faster upload
        }],
        'outtmpl': os.path.join(temp_dir, f"{video_id}.%(ext)s"),
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

        # yt-dlp adds the extension, find the actual file
        if os.path.exists(output_path):
            return output_path

        # Check for other audio formats
        for ext in ['mp3', 'm4a', 'webm', 'opus']:
            alt_path = os.path.join(temp_dir, f"{video_id}.{ext}")
            if os.path.exists(alt_path):
                return alt_path

        raise WhisperError(f"Audio file not found after download")

    except Exception as e:
        raise WhisperError(f"Failed to download audio: {str(e)}")


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API.

    Args:
        audio_path: Path to audio file

    Returns:
        Transcription text

    Raises:
        WhisperError: If transcription fails
    """
    if not settings.openai_api_key:
        raise WhisperError("OPENAI_API_KEY not configured")

    client = OpenAI(api_key=settings.openai_api_key)

    try:
        with open(audio_path, "rb") as audio_file:
            # Whisper API has 25MB limit, check file size
            file_size = os.path.getsize(audio_path)
            if file_size > 25 * 1024 * 1024:  # 25MB
                raise WhisperError(f"Audio file too large ({file_size / 1024 / 1024:.1f}MB). Max 25MB.")

            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
            )

        return transcript

    except Exception as e:
        if "too large" in str(e).lower():
            raise WhisperError(f"Audio file too large for Whisper API")
        raise WhisperError(f"Whisper transcription failed: {str(e)}")
    finally:
        # Clean up audio file
        try:
            os.remove(audio_path)
            os.rmdir(os.path.dirname(audio_path))
        except:
            pass


def transcribe_video(video_id: str) -> str:
    """
    Full pipeline: download audio and transcribe with Whisper.

    Args:
        video_id: YouTube video ID

    Returns:
        Transcription text

    Raises:
        WhisperError: If any step fails
    """
    audio_path = download_audio(video_id)
    return transcribe_audio(audio_path)
