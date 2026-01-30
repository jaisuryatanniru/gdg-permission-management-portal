import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserButton } from "@clerk/nextjs";
import { CheckIcon, ArrowUturnLeftIcon, ChartBarIcon, SparklesIcon } from "@heroicons/react/24/solid";


async function updateStatus(formData) {
  "use server";
  const { userId } = await auth();
  if (!userId) return;

  const id = parseInt(formData.get("id"));
  const status = formData.get("status");
  const requestTitle = formData.get("title");

  await prisma.permissionRequest.update({
    where: { id },
    data: { status },
  });

  
  await prisma.auditLog.create({
    data: {
      action: status.toUpperCase(), 
      details: `Request: ${requestTitle}`,
      actorId: userId,
    },
  });

  revalidatePath("/admin");
}


export default async function AdminPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (dbUser?.role !== "admin" && dbUser?.role !== "organizer") {
    redirect("/member");
  }

  
  const pendingRequests = await prisma.permissionRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const historyRequests = await prisma.permissionRequest.findMany({
    where: { status: { not: "pending" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true },
  });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: true },
  });

  const totalUsers = await prisma.user.count();
  const totalRequests = await prisma.permissionRequest.count();

  return (
    <div className="min-h-screen bg-gdg-grid text-gray-800 font-sans">
      
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-float">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-full px-6 py-3 flex items-center justify-between w-full max-w-6xl">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-sm">A</div>
            <span className="font-bold text-gray-700 tracking-tight">Organizer Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user?.firstName}</p>
              <div className="flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
                <p className="text-xs text-[#EA4335] font-bold uppercase">Admin Access</p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>

      <div className="pt-32 pb-20 max-w-6xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FBBC04]"></span> Pending Actions
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-gray-300 rounded-3xl p-10 text-center">
                <p className="text-gray-400 font-medium flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-[#FBBC04]" aria-hidden="true" />
                  <span>All caught up!</span>
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-yellow-500/5 relative overflow-hidden group">
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="font-bold text-xl text-gray-900">{req.title}</h3>
                    <span className="bg-yellow-50 text-[#FBBC04] border border-yellow-100 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
                  </div>

                  <div className="flex items-center gap-3 mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-50 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
                      {req.user.firstName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {req.user.firstName} {req.user.lastName}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-blue-700 px-2 py-0.5 rounded shadow-sm border border-blue-100">
                          {req.user.position}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{req.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 relative z-10">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Reason</span>
                    <p className="text-gray-700 text-sm leading-relaxed">{req.reason || "No details provided."}</p>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <form action={updateStatus} className="flex-1">
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="title" value={req.title} />
                      <input type="hidden" name="status" value="approved" />
                      <button className="w-full bg-[#34A853] hover:bg-[#2D8E46] text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                        <CheckIcon className="w-4 h-4" aria-hidden="true" />
                        Approve
                      </button>
                    </form>
                    <form action={updateStatus} className="flex-1">
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="title" value={req.title} />
                      <input type="hidden" name="status" value="rejected" />
                      <button className="w-full bg-white border-2 border-gray-100 hover:border-red-100 hover:bg-red-50 text-gray-600 hover:text-[#EA4335] font-bold py-3 rounded-xl transition-all active:scale-95">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-8">
            
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                Club Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-[#4285F4] mb-1">{totalUsers}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Members</span>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-[#34A853] mb-1">{totalRequests}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requests</span>
                </div>
              </div>
            </div>

          
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300"></span> Recent Activity
              </h2>
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                {historyRequests.map((req) => (
                  <div key={req.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{req.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        {req.user.firstName} • {req.user.position}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={req.id} />
                        <input type="hidden" name="title" value={req.title} />
                        <input type="hidden" name="status" value="pending" />
                        <button 
                          title="Undo / Revert to Pending"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-[#4285F4] text-gray-400 hover:text-white transition-all shadow-sm"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
                {historyRequests.length === 0 && (
                  <div className="p-6 text-center text-gray-400 text-sm">No history yet.</div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4285F4]"></span> Audit Logs
          </h2>
          
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actor (Admin)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {log.actor?.firstName || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          log.action === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                          log.action === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{log.details}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logs.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                System logs will appear here after actions are taken.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'approved') return <span className="w-2 h-2 rounded-full bg-[#34A853]" title="Approved"></span>;
  if (status === 'rejected') return <span className="w-2 h-2 rounded-full bg-[#EA4335]" title="Rejected"></span>;
  return <span className="w-2 h-2 rounded-full bg-[#FBBC04]" title="Pending"></span>;
}