"""Whisper transcription service using OpenAI API.

Supports downloading and transcribing audio from:
- YouTube
- TikTok
"""

import logging
import os
import tempfile
from pathlib import Path

import yt_dlp
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhisperError(Exception):
    """Error during Whisper transcription."""
    pass


def download_audio_from_url(url: str, video_id: str) -> str:
    """
    Download audio from any supported video URL using yt-dlp.

    Args:
        url: Full video URL (YouTube, TikTok, etc.)
        video_id: Unique identifier for the video (used for temp file naming)

    Returns:
        Path to downloaded audio file

    Raises:
        WhisperError: If download fails
    """
    # Create temp directory for audio
    temp_dir = tempfile.mkdtemp()
    # Sanitize video_id for filename (TikTok IDs can have special chars)
    safe_id = "".join(c if c.isalnum() else "_" for c in video_id)
    output_template = os.path.join(temp_dir, f"{safe_id}.%(ext)s")

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '64',  # Lower quality = smaller file = faster upload
        }],
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        # TikTok-specific options
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        # Follow redirects (important for vm.tiktok.com short URLs)
        'socket_timeout': 30,
    }

    try:
        logger.info("Downloading audio from: %s (video_id=%s)", url, video_id)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if info:
                logger.info(
                    "Downloaded: title=%s, uploader=%s, webpage_url=%s",
                    info.get("title"),
                    info.get("uploader"),
                    info.get("webpage_url"),
                )

        # Find the downloaded audio file
        expected_path = os.path.join(temp_dir, f"{safe_id}.mp3")
        if os.path.exists(expected_path):
            return expected_path

        # Check for other audio formats
        for ext in ['mp3', 'm4a', 'webm', 'opus', 'aac']:
            alt_path = os.path.join(temp_dir, f"{safe_id}.{ext}")
            if os.path.exists(alt_path):
                return alt_path

        # List all files in temp dir to help debug
        files = os.listdir(temp_dir)
        if files:
            # Return first audio file found
            for f in files:
                if f.endswith(('.mp3', '.m4a', '.webm', '.opus', '.aac')):
                    return os.path.join(temp_dir, f)

        raise WhisperError(f"Audio file not found after download. Files in temp: {files}")

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if "private" in error_msg or "login" in error_msg:
            raise WhisperError("Este video es privado o requiere iniciar sesión.")
        if "unavailable" in error_msg or "not available" in error_msg:
            raise WhisperError("El video no está disponible o fue eliminado.")
        raise WhisperError(f"Error al descargar el video: {str(e)}")

    except Exception as e:
        raise WhisperError(f"Error al descargar audio: {str(e)}")


def download_audio(video_id: str) -> str:
    """
    Legacy function: Download audio from YouTube video.

    Kept for backwards compatibility. Use download_audio_from_url for new code.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    return download_audio_from_url(url, video_id)


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
    Legacy function: Download and transcribe YouTube video.

    Kept for backwards compatibility. Use transcribe_from_url for new code.
    """
    audio_path = download_audio(video_id)
    return transcribe_audio(audio_path)


def transcribe_from_url(url: str, video_id: str) -> str:
    """
    Full pipeline: download audio from URL and transcribe with Whisper.

    Works with any platform supported by yt-dlp (YouTube, TikTok, etc.)

    Args:
        url: Full video URL
        video_id: Unique identifier for caching/naming

    Returns:
        Transcription text

    Raises:
        WhisperError: If any step fails
    """
    audio_path = download_audio_from_url(url, video_id)
    return transcribe_audio(audio_path)
