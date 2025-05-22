# %%
import neo4j
from neo4j_graphrag.llm import AzureOpenAILLM
from neo4j_graphrag.embeddings.openai import AzureOpenAIEmbeddings
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
import ipywidgets as widgets
from IPython.display import display, clear_output
import datetime
import uuid
import json
import os
import inspect
import traceback
import asyncio
import nest_asyncio
import time
import tempfile

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

# Neo4j connection details
NEO4J_URI = 'neo4j+s://2b3d22b4.databases.neo4j.io'
NEO4J_USERNAME = 'neo4j'
NEO4J_PASSWORD = 'HWXZODNtNjuGwGf4PJMg3vNzONWrrdQPxoLGvN-peaw'

# Azure OpenAI setup
llm = AzureOpenAILLM(
    model_name="gpt-4.1",
    azure_endpoint="https://ishaan.openai.azure.com/",
    api_version="2024-12-01-preview",
    api_key="2S4V3MfGWVFcJcJXk2eibRIOnBsru6tiIukQ587Jcne0KoGKLhgXJQQJ99BDACHYHv6XJ3w3AAABACOGPoUA",
)

embedder = AzureOpenAIEmbeddings(
    azure_endpoint="https://text-embedding-ada-002-ishaan.openai.azure.com",
    model="text-embedding-ada-002",
    api_key="7cTg7lr8xuwHaUFxjXU8XLwtHyk8lg7RT0pc6fTRCWCCrb3M0rBLJQQJ99BDACYeBjFXJ3w3AAABACOGVIat",
    api_version="2023-05-15"
)

# Define the schema
node_labels = ["Contract", "Clause", "Party", "Obligation", "Risk", "Policy"]
rel_types = ["CONTAINS", "BINDS", "IMPOSES", "VIOLATES", "ENFORCES"]

# LLM prompt template for extracting entities and relationships
prompt_template = '''
You are a contract risk analyst tasked with extracting information from contracts and structuring it into a property graph to enable risk identification, deviation analysis, and actionable mitigation planning.

Extract the entities (nodes) and specify their type from the following Input text. Also extract the relationships between these nodes. The relationship direction goes from the start node to the end node.

Return the result as JSON using the following format:
{{"nodes": [{{"id": "0", "label": "the type of entity", "properties": {{"name": "name of entity"}}}}],
  "relationships": [{{"type": "TYPE_OF_RELATIONSHIP", "start_node_id": "0", "end_node_id": "1", "properties": {{"details": "Description of the relationship"}}}}]}}

- Use only the information provided in the Input text. Do not add any external knowledge or assumptions.
- If the input text is empty, return an empty JSON.
- Create as many nodes and relationships as necessary to offer rich context for risk and compliance analysis.
- An AI knowledge assistant must be able to read this graph and immediately understand contract risks, deviations from policies, and required mitigations.
- Multiple contracts will be ingested from various sources, and this property graph will be used to connect information across them, so entity types must remain fairly general but accurate.

Use only the following nodes and relationships (if provided): {schema}

Assign a unique ID (string) to each node, and reuse it appropriately when defining relationships. Respect the valid source and target node types for each relationship. The direction of the relationship must follow what is logically correct based on the schema.

Do not return any explanations or additional information beyond the specified JSON.

Input text:

{text}
'''

class KnowledgeAssetMetadataCollector:
    def __init__(self):
        # Define the dropdown options
        self.ka_category_options = [
            'Template', 'Clause', 'Policy', 'Playbook', 'SOP', 'Embedded Guidance'
        ]

        self.business_unit_options = [
            'Consulting', 'Tax', 'All'
        ]

        self.sub_bu_options = [
            'Risk', 'Audit', 'Advisory', 'Other'
        ]

        self.business_function_options = [
            'Sales', 'Procurement', 'Legal', 'Finance', 'HR', 'IT'
        ]

        self.contract_types_options = [
            'MSA', 'SOW', 'NDA', 'Amendment', 'Order Form'
        ]

        self.commercial_models_options = [
            'T&M', 'Fixed Price', 'Loaned Staff', 'Outcome Based'
        ]

        self.risk_category_options = [
            'Independence', 'Risk Management', 'Cybersecurity', 'Regulatory', 'Financial'
        ]

        # Create the form widgets
        self.create_widgets()

    def create_widgets(self):
        # Common layout
        item_layout = widgets.Layout(width='100%')

        # Generate UUID for document_id
        self.document_id = widgets.Text(
            value=str(uuid.uuid4()),
            description='Document ID:',
            disabled=True,
            layout=item_layout
        )

        # Create all the form fields
        self.ka_category = widgets.Dropdown(
            options=self.ka_category_options,
            description='Category:',
            layout=item_layout
        )

        self.title = widgets.Text(
            placeholder='Enter document title',
            description='Title:',
            layout=item_layout
        )

        self.description = widgets.Textarea(
            placeholder='Enter a brief description',
            description='Description:',
            layout=item_layout
        )

        self.business_unit = widgets.SelectMultiple(
            options=self.business_unit_options,
            description='Business Unit:',
            layout=item_layout
        )

        self.sub_bu = widgets.SelectMultiple(
            options=self.sub_bu_options,
            description='Sub BU:',
            layout=item_layout
        )

        self.business_function = widgets.SelectMultiple(
            options=self.business_function_options,
            description='Business Function:',
            layout=item_layout
        )

        self.related_contract_types = widgets.SelectMultiple(
            options=self.contract_types_options,
            description='Contract Types:',
            layout=item_layout
        )

        self.applicable_commercial_models = widgets.SelectMultiple(
            options=self.commercial_models_options,
            description='Commercial Models:',
            layout=item_layout
        )

        self.mapping_primary_document = widgets.Text(
            placeholder='Enter primary document ID if applicable',
            description='Primary Doc:',
            layout=item_layout
        )

        self.risk_category = widgets.SelectMultiple(
            options=self.risk_category_options,
            description='Risk Category:',
            layout=item_layout
        )

        self.valuethreshold_rules = widgets.Textarea(
            placeholder='Enter applicable rules',
            description='Value Rules:',
            layout=item_layout
        )

        self.version_no = widgets.Text(
            value='1.0',
            description='Version:',
            layout=item_layout
        )

        self.relevance_tags = widgets.Text(
            placeholder='Enter tags separated by commas',
            description='Tags:',
            layout=item_layout
        )

        self.access_control = widgets.Text(
            placeholder='Enter RBAC information',
            description='Access Control:',
            layout=item_layout
        )

        # Submit button
        self.submit_button = widgets.Button(
            description='Save Metadata',
            button_style='success',
            layout=widgets.Layout(width='50%')
        )
        self.submit_button.on_click(self.on_submit_clicked)

        # Output area for feedback
        self.output = widgets.Output()

    def display_form(self):
        # Display all widgets in a form layout
        form_items = [
            self.document_id,
            self.ka_category,
            self.title,
            self.description,
            widgets.HBox([widgets.VBox([self.business_unit]), widgets.VBox([self.sub_bu])]),
            self.business_function,
            widgets.HBox([widgets.VBox([self.related_contract_types]), widgets.VBox([self.applicable_commercial_models])]),
            self.mapping_primary_document,
            self.risk_category,
            self.valuethreshold_rules,
            widgets.HBox([widgets.VBox([self.version_no]), widgets.VBox([self.relevance_tags])]),
            self.access_control,
            self.submit_button,
            self.output
        ]

        display(widgets.VBox(form_items))

    def on_submit_clicked(self, b):
        with self.output:
            clear_output()
            # Collect all form data as a dictionary
            metadata = {
                'document_id': self.document_id.value,
                'ka_category': self.ka_category.value,
                'title': self.title.value,
                'description': self.description.value,
                'business_unit': list(self.business_unit.value),
                'sub_bu': list(self.sub_bu.value),
                'business_function': list(self.business_function.value),
                'related_contract_types': list(self.related_contract_types.value),
                'applicable_commercial_models': list(self.applicable_commercial_models.value),
                'mapping_primary_document': self.mapping_primary_document.value,
                'risk_category': list(self.risk_category.value),
                'valuethreshold_rules': self.valuethreshold_rules.value,
                'last_updated': datetime.datetime.now().isoformat(),
                'version_no': self.version_no.value,
                'relevance_tags': [tag.strip() for tag in self.relevance_tags.value.split(',') if tag.strip()],
                'access_control': self.access_control.value
            }

            print("Metadata collected successfully!")

            # If there's a pipeline object in the parent scope, use it to save metadata
            try:
                # Find the parent ContractAnalysisPipeline instance
                for frame_info in inspect.stack():
                    frame = frame_info.frame
                    if 'self' in frame.f_locals and isinstance(frame.f_locals['self'], ContractAnalysisPipeline):
                        pipeline = frame.f_locals['self']
                        if hasattr(pipeline, 'current_kg_results'):
                            # Save both metadata and KG results
                            result = pipeline.save_to_neo4j(metadata, pipeline.current_kg_results)
                            if result:
                                print("✅ Successfully saved metadata and knowledge graph to Neo4j!")
                                # Display success message and reset form
                                pipeline.display_success_message(metadata['document_id'])
                            else:
                                print("❌ Failed to save data to Neo4j.")
                        break
            except Exception as e:
                print(f"Error while saving: {str(e)}")
                print(traceback.format_exc())

            return metadata

class ContractAnalysisPipeline:
    def __init__(self):
        self.driver = None
        try:
            print("Connecting to Neo4j database...")
            self.driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
            # Test the connection
            with self.driver.session() as session:
                result = session.run("RETURN 1 as test")
                test_value = result.single()["test"]
                print(f"Neo4j connection successful: {test_value}")
        except Exception as e:
            print(f"❌ Failed to connect to Neo4j: {str(e)}")
            print(traceback.format_exc())

        # Initialize the KG builder pipeline
        try:
            print("Initializing KG builder pipeline...")
            self.kg_builder_pdf = SimpleKGPipeline(
                llm=llm,
                driver=self.driver,
                text_splitter=FixedSizeSplitter(chunk_size=1000, chunk_overlap=200),
                embedder=embedder,
                entities=node_labels,
                relations=rel_types,
                prompt_template=prompt_template,
                from_pdf=True
            )
            print("KG builder pipeline initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize KG builder: {str(e)}")
            print(traceback.format_exc())

        # Initialize the metadata collector
        self.metadata_collector = KnowledgeAssetMetadataCollector()

        # Create file upload widget
        self.file_upload = widgets.FileUpload(
            accept='.pdf, .txt',  # Allow txt files too for testing
            multiple=False,
            description='Upload Contract'
        )

        self.process_button = widgets.Button(
            description='Process Document',
            button_style='primary'
        )
        self.process_button.on_click(self.on_process_clicked)

        # Add a text extraction option for debugging
        self.extract_text_only = widgets.Checkbox(
            value=False,
            description='Extract text only (debug mode)',
            disabled=False
        )

        self.output = widgets.Output()
        self.current_kg_results = None

    def display_uploader(self):
        display(widgets.VBox([
            widgets.HTML("<h2>Contract Analysis and Knowledge Graph Builder</h2>"),
            widgets.HTML("<h3>Step 1: Upload Contract Document</h3>"),
            self.file_upload,
            self.extract_text_only,
            self.process_button,
            self.output
        ]))

    def display_success_message(self, document_id):
        """Display a success message and option to process another document"""
        with self.output:
            clear_output()

            print(f"✅ Document with ID {document_id} successfully processed and saved!")

            # Create a button to process another document
            new_doc_button = widgets.Button(
                description="Process Another Document",
                button_style="success"
            )

            def on_new_doc_clicked(b):
                with self.output:
                    clear_output()
                    # Reset the file upload widget
                    self.file_upload.value.clear()
                    print("Ready to process a new document.")

            new_doc_button.on_click(on_new_doc_clicked)
            display(new_doc_button)

    def on_process_clicked(self, b):
        with self.output:
            clear_output()

            if not self.file_upload.value:
                print("Please upload a PDF or text file first.")
                return

            # Save uploaded file
            file_info = self.file_upload.value[0]  # Get the first uploaded file
            file_name = file_info.name
            file_content = file_info.content


            # Save to temporary file
            temp_dir = tempfile.gettempdir()
            temp_file_path = os.path.join(temp_dir, file_name)
            with open(temp_file_path, 'wb') as f:
                f.write(file_content)

            print(f"Processing document: {file_name}")
            print("This may take a few moments...")

            # Debug mode - extract text only
            if self.extract_text_only.value:
                try:
                    # For PDF files
                    if file_name.lower().endswith('.pdf'):
                        import PyPDF2
                        with open(temp_file_path, 'rb') as f:
                            pdf_reader = PyPDF2.PdfReader(f)
                            text = ""
                            for page_num in range(len(pdf_reader.pages)):
                                text += pdf_reader.pages[page_num].extract_text() + "\n\n"

                        print("Extracted text from PDF:")
                        print("=" * 40)
                        print(text[:1000] + "..." if len(text) > 1000 else text)
                        print("=" * 40)

                        # Skip further processing and show metadata form
                        print("\nPlease fill in the metadata for this document:")
                        self.metadata_collector.title.value = file_name.replace('.pdf', '')
                        self.metadata_collector.display_form()

                        # Create a minimal KG result for testing
                        self.current_kg_results = {
                            'nodes': [
                                {'id': '0', 'label': 'Contract', 'properties': {'name': file_name}}
                            ],
                            'relationships': []
                        }
                        return

                    # For text files
                    elif file_name.lower().endswith('.txt'):
                        with open(temp_file_path, 'r') as f:
                            text = f.read()

                        print("Extracted text from file:")
                        print("=" * 40)
                        print(text[:1000] + "..." if len(text) > 1000 else text)
                        print("=" * 40)

                        # Skip further processing and show metadata form
                        print("\nPlease fill in the metadata for this document:")
                        self.metadata_collector.title.value = file_name.replace('.txt', '')
                        self.metadata_collector.display_form()

                        # Create a minimal KG result for testing
                        self.current_kg_results = {
                            'nodes': [
                                {'id': '0', 'label': 'Contract', 'properties': {'name': file_name}}
                            ],
                            'relationships': []
                        }
                        return
                except Exception as e:
                    print(f"Error extracting text: {str(e)}")
                    print(traceback.format_exc())

            # Process with the full pipeline
            asyncio.create_task(self.process_document_with_progress(temp_file_path, file_name))

    async def process_document_with_progress(self, file_path, file_name):
        """Process the document with progress updates"""
        try:
            print("Starting document processing...")

            # Create a progress indicator
            progress_text = widgets.HTML("Step 1/3: Extracting text from document...")
            display(progress_text)

            # Show progress updates
            i = 0
            progress_indicators = ['.', '..', '...', '....']
            progress_task = asyncio.create_task(self.update_progress_indicator(progress_text))

            # Process the document with the KG pipeline
            pdf_result = await self.kg_builder_pdf.run_async(file_path=file_path)

            # Cancel the progress indicator task
            progress_task.cancel()

            print(f"✅ Document processed successfully!")
            print(f"Extracted {len(pdf_result['nodes'])} nodes and {len(pdf_result['relationships'])} relationships.")

            # Display a summary of extracted entities
            entity_counts = {}
            for node in pdf_result['nodes']:
                label = node['label']
                entity_counts[label] = entity_counts.get(label, 0) + 1

            print("\nExtracted entities:")
            for label, count in entity_counts.items():
                print(f"- {label}: {count}")

            # Display relationship summary
            rel_counts = {}
            for rel in pdf_result['relationships']:
                rel_type = rel['type']
                rel_counts[rel_type] = rel_counts.get(rel_type, 0) + 1

            print("\nExtracted relationships:")
            for rel_type, count in rel_counts.items():
                print(f"- {rel_type}: {count}")

            # Now display the metadata form for additional information
            print("\nPlease fill in the metadata for this document:")

            # Pre-fill the title with the filename
            self.metadata_collector.title.value = file_name.replace('.pdf', '').replace('.txt', '')

            # Display the metadata form
            self.metadata_collector.display_form()

            # Store the KG results to use when saving metadata
            self.current_kg_results = pdf_result

        except Exception as e:
            print(f"❌ Error processing document: {str(e)}")
            print(traceback.format_exc())

    async def update_progress_indicator(self, progress_widget):
        """Updates a progress indicator while waiting for processing to complete"""
        steps = ["Extracting text", "Analyzing content", "Building knowledge graph"]
        try:
            step_idx = 0
            while True:
                for i in range(4):  # Show progress animation
                    dots = '.' * (i + 1)
                    progress_widget.value = f"Step {step_idx+1}/3: {steps[step_idx]}{dots}"
                    await asyncio.sleep(0.5)

                # Move to next step every 12 seconds
                if step_idx < 2 and (step_idx * 12 < time.time() % 36):
                    step_idx = (step_idx + 1) % 3
        except asyncio.CancelledError:
            progress_widget.value = "Processing completed!"

    def save_to_neo4j(self, metadata, kg_results):
        """Save both the knowledge graph and metadata to Neo4j"""
        try:
            if not self.driver:
                print("Neo4j driver not initialized. Cannot save data.")
                return False

            with self.driver.session() as session:
                # First, create a document node with the metadata
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

                # Execute the document creation query
                result = session.run(doc_query, **metadata)
                document_id = result.single()["doc_id"]

                # Now connect all the KG nodes to this document
                # Create a map of node IDs to Neo4j node IDs
                node_id_map = {}

                # Create all the nodes from KG results
                for node in kg_results.get('nodes', []):
                    # Create a node properties dictionary
                    node_props = {
                        'knowledge_asset_id': document_id,  # Link to the document
                        **node.get('properties', {})
                    }

                    # Create the node
                    node_query = f"""
                    CREATE (n:{node['label']} $props)
                    RETURN id(n) as neo4j_id
                    """
                    node_result = session.run(node_query, props=node_props)
                    neo4j_id = node_result.single()["neo4j_id"]

                    # Store the mapping
                    node_id_map[node['id']] = neo4j_id

                # Create all the relationships
                for rel in kg_results.get('relationships', []):
                    # Get the Neo4j IDs for start and end nodes
                    start_neo4j_id = node_id_map.get(rel['start_node_id'])
                    end_neo4j_id = node_id_map.get(rel['end_node_id'])

                    if start_neo4j_id and end_neo4j_id:
                        # Create the relationship with properties
                        rel_query = f"""
                        MATCH (start) WHERE id(start) = $start_id
                        MATCH (end) WHERE id(end) = $end_id
                        CREATE (start)-[r:{rel['type']} $props]->(end)
                        RETURN id(r) as rel_id
                        """
                        session.run(rel_query,
                                   start_id=start_neo4j_id,
                                   end_id=end_neo4j_id,
                                   props=rel.get('properties', {}))

                # Also connect the document node to all top-level entity nodes
                connect_doc_query = """
                MATCH (doc:KnowledgeAsset {document_id: $doc_id})
                MATCH (n) WHERE n.knowledge_asset_id = $doc_id
                MERGE (doc)-[:CONTAINS]->(n)
                """
                session.run(connect_doc_query, doc_id=document_id)

                print(f"Successfully saved document with ID: {document_id}")
                print(f"Created {len(kg_results.get('nodes', []))} nodes and {len(kg_results.get('relationships', []))} relationships")
                return True

        except Exception as e:
            print(f"Error saving to Neo4j: {str(e)}")
            print(traceback.format_exc())
            return False

# Function to setup and run the pipeline
def run_contract_analysis_pipeline():
    # Try to import required packages
    try:
        import PyPDF2
        print("PyPDF2 is installed.")
    except ImportError:
        print("Installing PyPDF2 for text extraction...")
        # !pip install PyPDF2

    # For debug only - check if necessary packages are installed
    try:
        import ipywidgets
        print("ipywidgets is installed.")
    except ImportError:
        print("Installing ipywidgets...")
        # !pip install ipywidgets

    # Create and display the pipeline interface
    pipeline = ContractAnalysisPipeline()
    pipeline.display_uploader()

# Run the pipeline when this script is executed
if __name__ == "__main__":
    print("Starting Contract Analysis Pipeline")
    run_contract_analysis_pipeline()

# %%




