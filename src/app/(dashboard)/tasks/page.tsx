'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskFormDialog, TaskFormData } from '@/components/tasks/task-form-dialog';
import { DeleteTaskDialog } from '@/components/tasks/delete-task-dialog';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskPriorityColor,
  getTaskPriorityLabel,
  getTaskTypeLabel,
  getTaskTypeIcon,
} from '@/components/tasks/task-constants';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; firstName: string | null; lastName: string | null } | null;
  createdBy: { id: string; firstName: string | null; lastName: string | null } | null;
  deal: { id: string; title: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface Deal {
  id: string;
  title: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Fetch reference data
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/contacts?limit=100', { signal: controller.signal }).then((r) => r.json()),
      fetch('/api/deals?limit=100', { signal: controller.signal }).then((r) => r.json()),
    ]).then(([contactsRes, dealsRes]) => {
      if (contactsRes.success) setContacts(contactsRes.data.contacts);
      if (dealsRes.success) setDeals(dealsRes.data.deals);
      // Extract users from contacts' owners
      const userMap = new Map<string, User>();
      if (contactsRes.success) {
        for (const c of contactsRes.data.contacts) {
          if (c.owner) userMap.set(c.owner.id, c.owner);
          if (c.createdBy) userMap.set(c.createdBy.id, c.createdBy);
        }
      }
      if (dealsRes.success) {
        for (const d of dealsRes.data.deals) {
          if (d.owner) userMap.set(d.owner.id, d.owner);
        }
      }
      setUsers(Array.from(userMap.values()));
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  // Search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Fetch tasks
  useEffect(() => {
    const controller = new AbortController();
    startTransition(() => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: view === 'calendar' ? '200' : '20',
        sortBy,
        sortOrder,
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (typeFilter) params.set('type', typeFilter);

      fetch(`/api/tasks?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setTasks(json.data.tasks);
            setPagination(json.data.pagination);
          }
        })
        .catch(() => {});
    });
    return () => controller.abort();
  }, [page, searchQuery, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder, view]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreate = async (data: TaskFormData) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setCreateOpen(false);
      setPage(1);
      refreshTasks();
    }
  };

  const handleEdit = async (data: TaskFormData) => {
    if (!selectedTask) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditOpen(false);
      refreshTasks();
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteOpen(false);
      refreshTasks();
    }
  };

  const [fetchKey, setFetchKey] = useState(0);
  const refreshTasks = () => setFetchKey((k) => k + 1);

  // Re-fetch on fetchKey change
  useEffect(() => {
    if (fetchKey === 0) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: view === 'calendar' ? '200' : '20',
      sortBy,
      sortOrder,
    });
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (typeFilter) params.set('type', typeFilter);

    fetch(`/api/tasks?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTasks(json.data.tasks);
          setPagination(json.data.pagination);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [fetchKey, page, searchQuery, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder, view]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.startsWith(dateStr);
    });
  };

  const renderCalendar = () => {
    const { firstDay, daysInMonth } = getDaysInMonth(calendarMonth);
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    const today = new Date();
    const isCurrentMonth = calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() === today.getMonth();

    return (
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="border-b p-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const dayTasks = day ? getTasksForDate(day) : [];
              const isToday = isCurrentMonth && day === today.getDate();
              return (
                <div
                  key={`${wi}-${di}`}
                  className={`min-h-[100px] border-b border-r p-1 ${!day ? 'bg-muted/30' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <Link
                            key={t.id}
                            href={`/tasks/${t.id}`}
                            className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                              t.priority === 'HIGH' || t.priority === 'URGENT'
                                ? 'bg-orange-100 text-orange-800'
                                : t.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {getTaskTypeIcon(t.type)} {t.title}
                          </Link>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage and track your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-r-none"
            >
              <List className="mr-1 h-4 w-4" />
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="rounded-l-none"
            >
              <CalendarIcon className="mr-1 h-4 w-4" />
              Calendar
            </Button>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter || '_all'} onValueChange={(v) => { setStatusFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Status</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter || '_all'} onValueChange={(v) => { setPriorityFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Priority</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter || '_all'} onValueChange={(v) => { setTypeFilter(v === '_all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Types</SelectItem>
            {TASK_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        renderCalendar()
      ) : (
        <>
          {/* Table */}
          <div className="rounded-lg border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th
                      className="cursor-pointer px-4 py-3 text-left text-sm font-medium"
                      onClick={() => handleSort('title')}
                    >
                      Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th
                      className="cursor-pointer px-4 py-3 text-left text-sm font-medium"
                      onClick={() => handleSort('priority')}
                    >
                      Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Type</th>
                    <th
                      className="hidden cursor-pointer px-4 py-3 text-left text-sm font-medium lg:table-cell"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">Assignee</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        {isPending ? 'Loading...' : 'No tasks found'}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
                            {task.title}
                          </Link>
                          {task.deal && (
                            <p className="text-xs text-muted-foreground">{task.deal.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getTaskStatusColor(task.status)}>
                            {getTaskStatusLabel(task.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                            {getTaskPriorityLabel(task.priority)}
                          </Badge>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className="text-sm">
                            {getTaskTypeIcon(task.type)} {getTaskTypeLabel(task.type)}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-sm lg:table-cell">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="hidden px-4 py-3 text-sm lg:table-cell">
                          {task.assignee
                            ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim()
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/tasks/${task.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTask(task);
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
                  const pageNum = start + i;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
        users={users}
        deals={deals}
        contacts={contacts}
      />

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        mode="edit"
        initialData={selectedTask ? {
          title: selectedTask.title,
          description: selectedTask.description || '',
          status: selectedTask.status,
          priority: selectedTask.priority,
          type: selectedTask.type || '',
          dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
          assigneeId: selectedTask.assignee?.id || '',
          dealId: selectedTask.deal?.id || '',
          contactId: selectedTask.contact?.id || '',
        } : undefined}
        users={users}
        deals={deals}
        contacts={contacts}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        taskTitle={selectedTask?.title || ''}
      />
    </div>
  );
}
