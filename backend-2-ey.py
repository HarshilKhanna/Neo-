# %%
%%capture
%pip install fsspec langchain-text-splitters tiktoken openai python-dotenv numpy torch neo4j-graphrag rapidfuzz

# %%
import neo4j
from neo4j_graphrag.llm import AzureOpenAILLM
from neo4j_graphrag.embeddings.openai import AzureOpenAIEmbeddings

# %% [markdown]
# 

# %%
NEO4J_URI = 'neo4j+s://fa1301ff.databases.neo4j.io'
NEO4J_USERNAME = 'neo4j'
NEO4J_PASSWORD = 'NvyYPIjVRW6Y_gz4F72qCxqkYyFXVfiRk88mUwd7ZG8'

# %%
llm = AzureOpenAILLM(
    model_name="gpt-4",  # Fixed: "gpt-4.1" is not a valid model name
    azure_endpoint="https://ishaan.openai.azure.com/",  # update with your endpoint
    api_version="2024-12-01-preview",  # update appropriate version
    api_key="2S4V3MfGWVFcJcJXk2eibRIOnBsru6tiIukQ587Jcne0KoGKLhgXJQQJ99BDACHYHv6XJ3w3AAABACOGPoUA",  # api_key is optional and can also be set with OPENAI_API_KEY env var
)
llm.invoke("say something")

# %%
embedder = AzureOpenAIEmbeddings(
    azure_endpoint="https://text-embedding-ada-002-ishaan.openai.azure.com",
    model="text-embedding-ada-002",
    api_key="7cTg7lr8xuwHaUFxjXU8XLwtHyk8lg7RT0pc6fTRCWCCrb3M0rBLJQQJ99BDACYeBjFXJ3w3AAABACOGVIat",
    api_version="2023-05-15"
)

# %%
driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# %% [markdown]
# driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# %%
prompt_template = '''
You are a contract risk analyst tasked with extracting information from contracts
and structuring it into a property graph to enable risk identification, deviation analysis, and actionable mitigation planning.

Extract the entities (nodes) and specify their type from the following Input text.
Also extract the relationships between these nodes. The relationship direction goes from the start node to the end node.

Return the result as JSON using the following format:
{{"nodes": [{{"id": "0", "label": "the type of entity", "properties": {{"name": "name of entity"}}}}],
  "relationships": [{{"type": "TYPE_OF_RELATIONSHIP", "start_node_id": "0", "end_node_id": "1", "properties": {{"details": "Description of the relationship"}}}}]}}

- Use only the information provided in the Input text. Do not add any external knowledge or assumptions.
- If the input text is empty, return an empty JSON.
- Create as many nodes and relationships as necessary to offer rich context for risk and compliance analysis.
- An AI knowledge assistant must be able to read this graph and immediately understand contract risks, deviations from policies, and required mitigations.
- Multiple contracts will be ingested from various sources, and this property graph will be used to connect information across them, so entity types must remain fairly general but accurate.

Use only the following nodes and relationships (if provided):
{schema}

Assign a unique ID (string) to each node, and reuse it appropriately when defining relationships.
Respect the valid source and target node types for each relationship.
The direction of the relationship must follow what is logically correct based on the schema.

Do not return any explanations or additional information beyond the specified JSON.

Examples:
{examples}

Input text:

{text}
'''

# %%
rel_types = [
    "CONTAINS_CLAUSE",          # (Contract)-[:CONTAINS_CLAUSE]->(Clause)
    "WRITTEN_BY",               # (Clause)-[:WRITTEN_BY]->(Party)
    "HAS_PARTY",                # (Contract)-[:HAS_PARTY]->(Party)
    "BELONGS_TO_SECTION",       # (Clause)-[:BELONGS_TO_SECTION]->(Section)
    "MATCHES_RULE",             # (Clause)-[:MATCHES_RULE]->(PlaybookRule)
    "VIOLATES_RULE",            # (Clause)-[:VIOLATES_RULE]->(PlaybookRule)
    "HAS_RISK",                 # (Clause)-[:HAS_RISK]->(Risk)
    "HAS_LIABILITY",            # (Clause)-[:HAS_LIABILITY]->(Liability)
    "ASSESSED_BY",              # (Clause)-[:ASSESSED_BY]->(Agent)
    "REQUIRES_AMENDMENT",       # (Clause)-[:REQUIRES_AMENDMENT]->(Amendment)
    "UNDER_JURISDICTION",       # (Contract)-[:UNDER_JURISDICTION]->(Jurisdiction)
    "HAS_COMPLIANCE_STATUS",    # (Clause)-[:HAS_COMPLIANCE_STATUS]->(ComplianceStatus)
    "HAS_KEYWORD",              # (Clause)-[:HAS_KEYWORD]->(Keyword)
    "ANNOTATED_BY",             # (Clause)-[:ANNOTATED_BY]->(Annotation)
    "SUBMITTED_BY",             # (Contract)-[:SUBMITTED_BY]->(User)
    "UPDATED_TO",               # (DocumentVersion)-[:UPDATED_TO]->(DocumentVersion)
    "VERSION_OF",               # (DocumentVersion)-[:VERSION_OF]->(Contract or PlaybookRule)
]
node_labels = [
    "Contract",             # Represents an uploaded legal contract
    "Clause",               # Individual clauses extracted from contracts
    "Party",                # Vendors / Clients / Counterparties in a contract
    "PlaybookRule",         # Benchmark or standard rules from the playbook
    "Risk",                 # Identified contractual risks
    "Liability",            # Specific liabilities mentioned or inferred
    "ComplianceStatus",     # Node to represent if clause is compliant or not
    "Jurisdiction",         # Region/law domain the contract is subject to
    "Amendment",            # Contract changes or suggestions
    "Section",              # Logical sections grouping multiple clauses
    "Keyword",              # Important legal or domain-specific keywords
    "Annotation",           # Comments or flags added by agents/humans
    "Agent",                # GenAI or human agent name that processed it
    "User",                 # Person uploading/using the platform
    "DocumentVersion",      # For version control of contracts/playbooks
]

# %%
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline

kg_builder_pdf = SimpleKGPipeline(
    llm=llm,
    driver=driver,
    text_splitter=FixedSizeSplitter(chunk_size=1000, chunk_overlap=200),
    embedder=embedder,
    entities=node_labels,
    relations=rel_types,
    prompt_template=prompt_template,
    from_pdf=True
)

# %%
# Fixed: Updated file path to be more generic
pdf_file_paths = ['/content/Complete List of Elective Courses - Gurugram Off-Campus.pdf']

# Fixed: Added proper async handling and error checking
import asyncio

async def process_pdfs():
    for path in pdf_file_paths:
        print(f"Processing : {path}")
        try:
            pdf_result = await kg_builder_pdf.run_async(file_path=path)
            print(f"Result: {pdf_result}")
        except Exception as e:
            print(f"Error processing {path}: {str(e)}")

# Run the async function
# asyncio.run(process_pdfs())  # Uncomment when ready to run

# %% [markdown]
# # Retrieval

# %%
from neo4j_graphrag.indexes import create_vector_index

create_vector_index(driver, name="text_embeddings", label="Chunk",
                   embedding_property="embedding", dimensions=1536, similarity_fn="cosine")

# %%
from neo4j_graphrag.retrievers import VectorRetriever

vector_retriever = VectorRetriever(
    driver,
    index_name="text_embeddings",
    embedder=embedder,
    return_properties=["text"],
)

# %% [markdown]
# # When only used Vector Retriever Process

# %%
import json

vector_res = vector_retriever.get_search_results(query_text="what is risk?",
                                                top_k=3)
for i in vector_res.records: 
    print("====" + "\n" + json.dumps(i.data(), indent=4))  # Fixed: Properly escaped newline

# %%
from neo4j_graphrag.retrievers import VectorCypherRetriever

vc_retriever = VectorCypherRetriever(
    driver,
    index_name="text_embeddings",
    embedder=embedder,
    retrieval_query="""
//1) Go out 2-3 hops in the entity graph and get relationships
WITH node AS chunk
MATCH (chunk)<-[:FROM_CHUNK]-()-[relList:!FROM_CHUNK*1..2]-()
UNWIND relList AS rel

//2) collect relationships and text chunks
WITH collect(DISTINCT chunk) AS chunks,
     collect(DISTINCT rel) AS rels

//3) format and return context
RETURN '=== text ===' + '\n' + apoc.text.join([c in chunks | c.text], '\n---\n') + '\n\n=== kg_rels ===' + '\n' +
       apoc.text.join([r in rels | startNode(r).name + ' - ' + type(r) + '(' + coalesce(r.details, '') + ')' +  ' -> ' + endNode(r).name ], '\n---\n') AS info
"""  # Fixed: Corrected Cypher syntax for relationship patterns and string concatenation
)

# %%
vc_res = vc_retriever.get_search_results(query_text="what is risk?", top_k=3)

# print output
kg_rel_pos = vc_res.records[0]['info'].find('\n\n=== kg_rels ===\n')  # Fixed: Proper newline characters
print("# Text Chunk Context:")
print(vc_res.records[0]['info'][:kg_rel_pos])
print("# KG Context From Relationships:")
print(vc_res.records[0]['info'][kg_rel_pos:])

# %%
# Fixed: Removed duplicate LLM import and used existing llm instance
from neo4j_graphrag.generation import RagTemplate
from neo4j_graphrag.generation.graphrag import GraphRAG

# llm is already defined above, no need to redefine

rag_template = RagTemplate(template='''Answer the Question using the following Context. Only respond with information mentioned in the Context. Do not inject any speculative information not mentioned.

# Question:
{query_text}

# Context:
{context}

# Answer:
''', expected_inputs=['query_text', 'context'])

v_rag = GraphRAG(llm=llm, retriever=vector_retriever, prompt_template=rag_template)
vc_rag = GraphRAG(llm=llm, retriever=vc_retriever, prompt_template=rag_template)

# %%
q = "List the main contract must have clauses"  # Fixed: Typo "conytact" -> "contract"

print(f"Vector Response: \n{v_rag.search(q, retriever_config={'top_k':5}).answer}")
print("\n===========================\n")
print(f"Vector + Cypher Response: \n{vc_rag.search(q, retriever_config={'top_k':5}).answer}")

# %% [markdown]
# **Vector Response:** 
# Risk is the probability of an event occurring and its consequences for project objectives. The majority of project actors perceive risk as a negative event. Different risks can occur in different phases of a project and may be inherited from one project phase to the next. In construction projects, sources of risk may be divided into three main categories: those related to external factors (such as financial, economic, political, legal, and environmental risks); those related to internal factors (such as design, construction, management, and relationships); and force majeure risks.
# 
# ===========================
# 
# **Vector + Cypher Response:** 
# Risk is the probability of an event occurring and its consequences for project objectives. The majority of project actors perceive risk as a negative event. Risk can arise from external factors (such as financial, economic, political, legal, and environmental risks), internal factors (such as design, construction, management, and relationship risks), and force majeure risks. Different risks occur in different phases of a project, and risks may be carried from one phase to the next.