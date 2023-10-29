import os
import openai
from llama_index import download_loader
from llama_index import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from llama_index.llms import OpenAI
import json
import pathlib
import logging
from llama_index import StorageContext, load_index_from_storage
import os

logger = logging.getLogger(__name__)

UnstructuredReader = download_loader('UnstructuredReader')

class MyLlamaIndex:
    def __init__(self, data_dir, metadata_path) -> None:
        self.metadata = self.__get_metadata(metadata_path)
        self.vector_store_index = rec_index_load(data_dir)
        self.user_to_last_nodes = {}
        self.user_to_last_answer = {}

    def get_response(self, question, user_id):
        nodes = self.__get_nodes(question)
        self.__set_nodes(nodes, user_id)
        answer = self.__get_answer(question)
        self.__set_answer(answer, user_id)

        results = [self.__get_metadata_from_id(node.metadata["id"]) for node in nodes]
        return {
            "result": results
            , "answer": answer.response
            , "question": question
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
        self.user_to_last_nodes[user_id] = nodes
    
    def __set_answer(self, answer, user_id):
        self.user_to_last_answer[user_id] = answer

    def __get_metadata_from_id(self, id):
        return self.metadata[id]


# rebuild storage context
def build_storage_context(persist_dir : str = "./data/storage" ) :
    storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
    return storage_context

def load_index(storage_context) :
    index = load_index_from_storage(storage_context)
    return index

# def rec_index_load(storage) :
#     index_dict = {}
#     for folder_name in os.listdir(storage):
#         folder_path = os.path.join(storage, folder_name)
#         storage_context = build_storage_context(folder_path)
#         index = load_index(storage_context)
#         index_dict[folder_name] = index
#     return(index_dict)

def rec_index_load(folder_path) :
    storage_context = build_storage_context(folder_path)
    index = load_index(storage_context)
    return index
