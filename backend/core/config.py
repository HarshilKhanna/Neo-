import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Neo4j settings
    NEO4J_URI: str = 'neo4j+s://2b3d22b4.databases.neo4j.io'
    NEO4J_USERNAME: str = 'neo4j'
    NEO4J_PASSWORD: str = 'HWXZODNtNjuGwGf4PJMg3vNzONWrrdQPxoLGvN-peaw'

    # Azure OpenAI settings
    AZURE_OPENAI_ENDPOINT: str = "https://ishaan.openai.azure.com/"
    AZURE_OPENAI_API_KEY: str = "2S4V3MfGWVFcJcJXk2eibRIOnBsru6tiIukQ587Jcne0KoGKLhgXJQQJ99BDACHYHv6XJ3w3AAABACOGPoUA"
    AZURE_OPENAI_API_VERSION: str = "2024-12-01-preview"
    AZURE_OPENAI_MODEL: str = "gpt-4.1"

    # Azure OpenAI Embeddings settings
    AZURE_EMBEDDINGS_ENDPOINT: str = "https://text-embedding-ada-002-ishaan.openai.azure.com"
    AZURE_EMBEDDINGS_API_KEY: str = "7cTg7lr8xuwHaUFxjXU8XLwtHyk8lg7RT0pc6fTRCWCCrb3M0rBLJQQJ99BDACYeBjFXJ3w3AAABACOGVIat"
    AZURE_EMBEDDINGS_API_VERSION: str = "2023-05-15"
    AZURE_EMBEDDINGS_MODEL: str = "text-embedding-ada-002"

    # Knowledge Graph settings
    NODE_LABELS: list = ["Contract", "Clause", "Party", "Obligation", "Risk", "Policy"]
    RELATIONSHIP_TYPES: list = ["CONTAINS", "BINDS", "IMPOSES", "VIOLATES", "ENFORCES"]

    class Config:
        env_file = ".env"

settings = Settings()