from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class KnowledgeAssetMetadata(BaseModel):
    document_id: str = Field(..., description="Unique identifier for the document")
    ka_category: str = Field(..., description="Category of the knowledge asset")
    title: str = Field(..., description="Title of the document")
    description: Optional[str] = Field(None, description="Brief description of the document")
    business_unit: List[str] = Field(..., description="List of business units")
    sub_bu: List[str] = Field(..., description="List of sub-business units")
    business_function: List[str] = Field(..., description="List of business functions")
    related_contract_types: List[str] = Field(..., description="List of related contract types")
    applicable_commercial_models: List[str] = Field(..., description="List of applicable commercial models")
    mapping_primary_document: Optional[str] = Field(None, description="Primary document ID if applicable")
    risk_category: List[str] = Field(..., description="List of risk categories")
    valuethreshold_rules: Optional[str] = Field(None, description="Applicable value threshold rules")
    version_no: str = Field(default="1.0", description="Version number")
    relevance_tags: List[str] = Field(default_factory=list, description="List of relevance tags")
    access_control: Optional[str] = Field(None, description="Access control information")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class ProcessResponse(BaseModel):
    status: str
    message: str
    document_id: Optional[str] = None
    nodes_count: Optional[int] = None
    relationships_count: Optional[int] = None

class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    details: Optional[str] = None