from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uuid
from datetime import datetime

from .models import KnowledgeAssetMetadata, ProcessResponse, ErrorResponse
from .services import ContractAnalysisService

app = FastAPI(
    title="Contract Analysis API",
    description="API for analyzing contracts and building knowledge graphs",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the service instance
def get_service():
    service = ContractAnalysisService()
    try:
        yield service
    finally:
        service.close()

@app.post("/process/", response_model=ProcessResponse)
async def process_document(
    file: UploadFile = File(...),
    service: ContractAnalysisService = Depends(get_service)
):
    """Process a document and return the knowledge graph results"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Process the document
        kg_results = await service.process_document(file_content, file.filename)
        
        return ProcessResponse(
            status="success",
            message="Document processed successfully",
            nodes_count=len(kg_results.get('nodes', [])),
            relationships_count=len(kg_results.get('relationships', []))
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/metadata/", response_model=ProcessResponse)
async def submit_metadata(
    metadata: KnowledgeAssetMetadata,
    service: ContractAnalysisService = Depends(get_service)
):
    """Submit metadata for a processed document"""
    try:
        # Convert Pydantic model to dict
        metadata_dict = metadata.dict()
        
        # Save to Neo4j
        success = service.save_to_neo4j(metadata_dict, {})
        
        if success:
            return ProcessResponse(
                status="success",
                message="Metadata saved successfully",
                document_id=metadata.document_id
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save metadata"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)