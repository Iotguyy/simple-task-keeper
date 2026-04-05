import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ListChecks } from "lucide-react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

const Index = () => {
  const [newTodo, setNewTodo] = useState("");
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Todo[];
    },
  });

  const addTodo = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("todos").insert({ title });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodo("");
    },
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("todos").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) addTodo.mutate(newTodo.trim());
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <ListChecks className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Todo App</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1"
          />
          <Button type="submit" disabled={addTodo.isPending || !newTodo.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </form>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No todos yet. Add one above!</p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 group"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={(checked) =>
                    toggleTodo.mutate({ id: todo.id, completed: !!checked })
                  }
                />
                <span
                  className={`flex-1 text-card-foreground ${
                    todo.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {todo.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  onClick={() => deleteTodo.mutate(todo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Index;
