import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { Todo, TodoStatus } from '../types';
import { generateId } from '../utils/date';

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTodos = useCallback(async () => {
    try {
      const data = await apiClient.getTodos();
      const todosData: Todo[] = data.map((row: any) => ({
        id: row.id,
        content: row.content,
        status: row.status as TodoStatus,
        createdAt: row.createdAt,
        startedAt: row.startedAt || undefined,
        completedAt: row.completedAt || undefined,
      }));
      setTodos(todosData);
    } catch (error) {
      console.error('加载待办失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = async (content: string) => {
    const todo: Todo = {
      id: generateId(),
      content,
      createdAt: Date.now(),
      status: 'pending',
    };

    await apiClient.createTodo(todo);
    await loadTodos();
    return todo;
  };

  const startTodo = async (id: string) => {
    await apiClient.updateTodo(id, {
      status: 'in-progress',
      startedAt: Date.now(),
    });
    await loadTodos();
  };

  const completeTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    await apiClient.updateTodo(id, {
      status: 'completed',
      completedAt: Date.now(),
      startedAt: todo.startedAt || Date.now(),
    });
    await loadTodos();
    return todo;
  };

  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    const updates: any = { status };

    if (status === 'in-progress') {
      updates.startedAt = Date.now();
    } else if (status === 'completed') {
      updates.completedAt = Date.now();
      const todo = todos.find(t => t.id === id);
      if (todo && !todo.startedAt) {
        updates.startedAt = Date.now();
      }
    }

    await apiClient.updateTodo(id, updates);
    await loadTodos();
  };

  const deleteTodo = async (id: string) => {
    await apiClient.deleteTodo(id);
    await loadTodos();
  };

  const getTodosByStatus = (status: TodoStatus) => {
    return todos.filter(t => t.status === status);
  };

  return {
    todos,
    loading,
    addTodo,
    startTodo,
    completeTodo,
    updateTodoStatus,
    deleteTodo,
    getTodosByStatus,
    refresh: loadTodos,
  };
};
