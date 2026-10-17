import React from 'react';
import { Task, Engagement, Client } from '../types/crm';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  engagements: Engagement[];
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  engagements,
  clients,
  onSelectClient,
}) => {
  // Group tasks and expected closes by date
  const eventsByDate = new Map<string, { type: 'task' | 'close'; item: any; client?: Client }[]>();

  tasks.forEach((t) => {
    const d = t.due_at ? t.due_at.split('T')[0] : 'undated';
    const client = clients.find((c) => c.id === t.client_id);
    const existing = eventsByDate.get(d) || [];
    existing.push({ type: 'task', item: t, client });
    eventsByDate.set(d, existing);
  });

  engagements.forEach((e) => {
    if (e.expected_close && !e.archived_at) {
      const d = e.expected_close;
      const client = clients.find((c) => c.id === e.client_id);
      const existing = eventsByDate.get(d) || [];
      existing.push({ type: 'close', item: e, client });
      eventsByDate.set(d, existing);
    }
  });

  const sortedDates = Array.from(eventsByDate.keys()).sort();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-cyan-400" />
          <span>Sales Diary & Operational Schedule</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological schedule of client task deadlines, follow-up milestones, and expected deal close dates.
        </p>
      </div>

      <div className="space-y-4">
        {sortedDates.map((dateStr) => {
          const events = eventsByDate.get(dateStr) || [];

          return (
            <div key={dateStr} className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-sm text-cyan-400">{dateStr}</span>
                <span className="text-xs text-slate-400 font-mono">{events.length} event(s)</span>
              </div>

              <div className="space-y-2">
                {events.map((ev, idx) => (
                  <div
                    key={idx}
                    onClick={() => ev.client && onSelectClient(ev.client.id)}
                    className="p-2.5 bg-[#0a1329] border border-slate-800 hover:border-cyan-500/60 rounded cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {ev.type === 'task' ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-100">
                          {ev.type === 'task' ? ev.item.title : `Expected Close: ${ev.item.title}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Client: <strong>{ev.client?.name || 'Client'}</strong> ({ev.client?.client_code})
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      {ev.type === 'task' ? `Priority: ${ev.item.priority}` : `${ev.item.value_estimate} ${ev.item.currency}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {sortedDates.length === 0 && (
          <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-lg text-slate-500 text-xs italic">
            No scheduled sales diary events or upcoming task deadlines.
          </div>
        )}
      </div>
    </div>
  );
};
