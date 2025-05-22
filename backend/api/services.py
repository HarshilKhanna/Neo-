import neo4j
from neo4j_graphrag.llm import AzureOpenAILLM
from neo4j_graphrag.embeddings.openai import AzureOpenAIEmbeddings
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
import tempfile
import os
import PyPDF2
from typing import Dict, Any, Optional
from core.config import settings

class ContractAnalysisService:
    def __init__(self):
        self.driver = None
        self.kg_builder = None
        self._initialize_services()

    def _initialize_services(self):
        """Initialize Neo4j and KG builder services"""
        try:
            # Initialize Neo4j driver
            self.driver = neo4j.GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            )

            # Initialize Azure OpenAI LLM
            llm = AzureOpenAILLM(
                model_name=settings.AZURE_OPENAI_MODEL,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                api_key=settings.AZURE_OPENAI_API_KEY,
            )

            # Initialize Azure OpenAI Embeddings
            embedder = AzureOpenAIEmbeddings(
                azure_endpoint=settings.AZURE_EMBEDDINGS_ENDPOINT,
                model=settings.AZURE_EMBEDDINGS_MODEL,
                api_key=settings.AZURE_EMBEDDINGS_API_KEY,
                api_version=settings.AZURE_EMBEDDINGS_API_VERSION
            )

            # Initialize KG builder
            self.kg_builder = SimpleKGPipeline(
                llm=llm,
                driver=self.driver,
                text_splitter=FixedSizeSplitter(chunk_size=1000, chunk_overlap=200),
                embedder=embedder,
                entities=settings.NODE_LABELS,
                relations=settings.RELATIONSHIP_TYPES,
                from_pdf=True
            )

        except Exception as e:
            raise Exception(f"Failed to initialize services: {str(e)}")

    async def process_document(self, file_content: bytes, file_name: str) -> Dict[str, Any]:
        """Process a document and return the knowledge graph results"""
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name

            # Process the document
            kg_results = await self.kg_builder.run_async(file_path=temp_file_path)

            # Clean up temporary file
            os.unlink(temp_file_path)

            return kg_results

        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")

    def save_to_neo4j(self, metadata: Dict[str, Any], kg_results: Dict[str, Any]) -> bool:
        """Save both metadata and knowledge graph to Neo4j"""
        try:
            if not self.driver:
                raise Exception("Neo4j driver not initialized")

            with self.driver.session() as session:
                # Create document node with metadata
                doc_query = """
                CREATE (doc:KnowledgeAsset {
                    document_id: $document_id,
                    ka_category: $ka_category,
                    title: $title,
                    description: $description,
                    business_unit: $business_unit,
                    sub_bu: $sub_bu,
                    business_function: $business_function,
                    related_contract_types: $related_contract_types,
                    applicable_commercial_models: $applicable_commercial_models,
                    mapping_primary_document: $mapping_primary_document,
                    risk_category: $risk_category,
                    valuethreshold_rules: $valuethreshold_rules,
                    last_updated: $last_updated,
                    version_no: $version_no,
                    relevance_tags: $relevance_tags,
                    access_control: $access_control
                })
                RETURN doc.document_id as doc_id
                """

                result = session.run(doc_query, **metadata)
                document_id = result.single()["doc_id"]

                # Create nodes and relationships
                node_id_map = {}
                for node in kg_results.get('nodes', []):
                    node_props = {
                        'knowledge_asset_id': document_id,
                        **node.get('properties', {})
                    }

                    node_query = f"""
                    CREATE (n:{node['label']} $props)
                    RETURN id(n) as neo4j_id
                    """
                    node_result = session.run(node_query, props=node_props)
                    node_id_map[node['id']] = node_result.single()["neo4j_id"]

                # Create relationships
                for rel in kg_results.get('relationships', []):
                    start_neo4j_id = node_id_map.get(rel['start_node_id'])
                    end_neo4j_id = node_id_map.get(rel['end_node_id'])

                    if start_neo4j_id and end_neo4j_id:
                        rel_query = f"""
                        MATCH (start) WHERE id(start) = $start_id
                        MATCH (end) WHERE id(end) = $end_id
                        CREATE (start)-[r:{rel['type']} $props]->(end)
                        """
                        session.run(rel_query,
                                  start_id=start_neo4j_id,
                                  end_id=end_neo4j_id,
                                  props=rel.get('properties', {}))

                # Connect document to all nodes
                connect_doc_query = """
                MATCH (doc:KnowledgeAsset {document_id: $doc_id})
                MATCH (n) WHERE n.knowledge_asset_id = $doc_id
                MERGE (doc)-[:CONTAINS]->(n)
                """
                session.run(connect_doc_query, doc_id=document_id)

                return True

        except Exception as e:
            raise Exception(f"Error saving to Neo4j: {str(e)}")

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name

            with open(temp_file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n\n"

            os.unlink(temp_file_path)
            return text

        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()