import os
import openai
from llama_index import download_loader
from llama_index import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from llama_index.llms import OpenAI
from llama_hub.file.unstructured import UnstructuredReader
import json

class MyLlamaIndex:
    def __init__(self, data_dir, metadata_path) -> None:
        self.metadata = self.__get_metadata(metadata_path)
        self.vector_store_index = self.__get_vector_store_index(data_dir)
        self.user_to_last_nodes = {}
        self.user_to_last_answer = {}

    def __get_vector_store_index(self, data_path):
        os.environ["OPENAI_API_KEY"] = "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"
        openai.api_key = os.environ["OPENAI_API_KEY"]
        def format_file_metadata(filepath):
            stem, extension = filepath.name.split(".", maxsplit=1)
            return {
                'id': stem
                , 'type': extension
            }
    
        dir_reader = SimpleDirectoryReader(data_path
                                        , file_metadata=format_file_metadata
                                        , file_extractor={
                                            ".pdf": UnstructuredReader()
                                            ,".html": UnstructuredReader()
                                            }
                                        )
        documents = dir_reader.load_data()
        llm = OpenAI(temperature=0.1, model="gpt-4")
        service_context = ServiceContext.from_defaults(llm=llm)
        vector_store_index = VectorStoreIndex.from_documents(
                                documents
                                , service_context=service_context)
        return vector_store_index

    def get_response(self, question, user_id):
        nodes = self.__get_nodes(question)
        self.__set_nodes(nodes, user_id)
        answer = self.__get_answer(question)
        self.__set_asnwer(answer, user_id)

        results = [self.__get_metadata_from_id(node["id"]) for node in nodes]
        return {
            "result": results
            , "answer": answer
        }

    def __get_nodes(self, question):
        retriever = self.vector_store_index.as_retriever(similarity_top_k=3)
        nodes = retriever.retrieve(question)
        return nodes
    
    def __get_answer(self, question):
        query_engine = self.vector_store_index.as_query_engine() # TODO: this question recalls the first one
        answer = query_engine.query(question)
        return answer

    def __get_metadata(self, metadata_path):
        with open(metadata_path, "r") as f:
            data = json.load(f)
        return data
    
    def __set_nodes(self, nodes, user_id):
        self.nodes[user_id] = nodes
    

    def __get_metadata_from_id(self, id):
        return self.metadata[id]


