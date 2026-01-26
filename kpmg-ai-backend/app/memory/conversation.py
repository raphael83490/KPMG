"""Conversation memory management"""
from langchain.memory import ConversationBufferWindowMemory
from typing import Dict
import os


class MemoryManager:
    """Manages conversation memories for different conversation IDs"""
    
    def __init__(self):
        self.memories: Dict[str, ConversationBufferWindowMemory] = {}
    
    def get_memory(self, conversation_id: str) -> ConversationBufferWindowMemory:
        """
        Get or create a memory for a conversation ID
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            ConversationBufferWindowMemory instance
        """
        if conversation_id not in self.memories:
            self.memories[conversation_id] = ConversationBufferWindowMemory(
                k=10,  # Garder les 10 derniers échanges
                return_messages=True
            )
        return self.memories[conversation_id]
    
    def clear_memory(self, conversation_id: str):
        """
        Clear memory for a specific conversation
        
        Args:
            conversation_id: Conversation ID to clear
        """
        if conversation_id in self.memories:
            del self.memories[conversation_id]
    
    def clear_all(self):
        """Clear all memories"""
        self.memories.clear()


# Singleton instance
_memory_manager = None


def get_memory_manager() -> MemoryManager:
    """Get the singleton memory manager instance"""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = MemoryManager()
    return _memory_manager
