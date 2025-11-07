import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useCallback, useState } from 'react';

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

// In-memory storage for Cloudflare Workers (data won't persist between deployments)
let inMemoryTodos = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
];

const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => {
  return inMemoryTodos;
});

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const newTodo = { id: inMemoryTodos.length + 1, name: data };
    inMemoryTodos = [...inMemoryTodos, newTodo];
    return inMemoryTodos;
  });

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: Home,
  loader: async () => await getTodos(),
});

function Home() {
  const router = useRouter();
  let todos = Route.useLoaderData();

  const [todo, setTodo] = useState('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: todos is being assigned, not used as a dependency
  const submitTodo = useCallback(async () => {
    todos = await addTodo({ data: todo });
    setTodo('');
    router.invalidate();
  }, [todo, router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)',
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border-8 border-black/10 bg-black/50 p-8 shadow-xl backdrop-blur-md">
        <h1 className="mb-4 text-2xl">Start Server Functions - Todo Example</h1>
        <p className="mb-4 text-sm text-yellow-400">
          Note: Using in-memory storage (data won't persist)
        </p>
        <ul className="mb-4 space-y-2">
          {todos?.map((t: { id: number; name: string }) => (
            <li
              key={t.id}
              className="rounded-lg border border-white/20 bg-white/10 p-3 shadow-md backdrop-blur-sm"
            >
              <span className="text-lg text-white">{t.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitTodo();
              }
            }}
            placeholder="Enter a new todo..."
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="rounded-lg bg-blue-500 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-500/50"
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  );
}
