export async function listTaskLists(accessToken: string) {
  const res = await fetch(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Tasks API error: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    updated: l.updated,
  }));
}

export async function listTasks(
  accessToken: string,
  taskListId: string = "@default",
  maxResults: number = 20
) {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?maxResults=${maxResults}&showCompleted=false`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Tasks API error: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    notes: t.notes || "",
    due: t.due || null,
    status: t.status,
    updated: t.updated,
  }));
}

export async function createTask(
  accessToken: string,
  title: string,
  notes?: string,
  due?: string,
  taskListId: string = "@default"
) {
  const body: any = { title };
  if (notes) body.notes = notes;
  if (due) body.due = due;

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Tasks create error: ${JSON.stringify(err)}`);
  }
  const task = await res.json();
  return { id: task.id, title: task.title, status: task.status };
}

export async function completeTask(
  accessToken: string,
  taskId: string,
  taskListId: string = "@default"
) {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    }
  );
  if (!res.ok) throw new Error(`Tasks complete error: ${res.status}`);
  return await res.json();
}