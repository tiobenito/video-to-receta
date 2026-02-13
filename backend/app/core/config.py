from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://localhost:5432/video_to_recipe"

    # API Keys
    anthropic_api_key: str = ""
    openai_api_key: str = ""  # For Whisper fallback

    # Notion integration
    notion_api_key: str = ""
    notion_database_id: str = ""

    # App settings
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
