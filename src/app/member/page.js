import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { PencilSquareIcon, HandRaisedIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

async function submitRequest(formData) {
  "use server";
  const { userId } = await auth();
  if (!userId) return;

  await prisma.permissionRequest.create({
    data: {
      title: formData.get("title"),
      reason: formData.get("reason"),
      userId,
      status: "pending",
    },
  });
  redirect("/member?success=true");
}

async function updateProfile(formData) {
  "use server";
  const { userId } = await auth();
  if (!userId) return;

  const position = formData.get("position");
  
  await prisma.user.update({
    where: { id: userId },
    data: { position },
  });
  
  revalidatePath("/member");
}

export default async function MemberPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ 
    where: { id: userId } 
  });

  const myRequests = await prisma.permissionRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gdg-grid text-gray-800 font-sans selection:bg-blue-100">
      
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-float">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#EA4335]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FBBC04]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></div>
            </div>
            <span className="font-bold text-gray-700 tracking-tight">GDG Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user?.firstName}</p>
              <p className="text-xs text-gray-500 font-medium">
                {dbUser?.position || "Member"}
              </p>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>

      <div className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            Make it <span className="text-[#4285F4]">Happen.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Submit your permission requests for GDG events and resources.
          </p>
        </div>

        {dbUser?.position === "Member" && (
          <div className="mb-12 bg-blue-50 border border-blue-100 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-pulse-slow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-sm">
                <HandRaisedIcon className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">What is your role?</h3>
                <p className="text-blue-700 text-sm">
                  Please set your Club Position (e.g., Web Lead) so Admins know who you are.
                </p>
              </div>
            </div>
            
            <form action={updateProfile} className="flex w-full sm:w-auto gap-2">
              <input 
                name="position" 
                required 
                placeholder="e.g. Web Dev Lead" 
                className="px-4 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-48 text-sm"
              />
              <button className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md whitespace-nowrap text-sm">
                Save Role
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/5 border border-gray-100 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PencilSquareIcon className="w-6 h-6 text-gray-700" aria-hidden="true" />
                New Request
              </h2>
              
              <form action={submitRequest} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                  <input
                    name="title"
                    required
                    placeholder="Workshop Name"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4285F4] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</label>
                  <textarea
                    name="reason"
                    required
                    rows="4"
                    placeholder="Why is this needed?"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4285F4] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Send Request</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pl-2">Your History</h2>
            
            {myRequests.length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                <p className="text-gray-400 font-medium">No requests yet.</p>
              </div>
            ) : (
              myRequests.map((req) => (
                <div key={req.id} className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-[#4285F4] transition-all hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    req.status === 'approved' ? 'bg-[#34A853]' : 
                    req.status === 'rejected' ? 'bg-[#EA4335]' : 'bg-[#FBBC04]'
                  }`}></div>

                  <div className="flex justify-between items-start mb-2 pl-2">
                    <h3 className="font-bold text-lg text-gray-800">{req.title}</h3>
                    <StatusPill status={req.status} />
                  </div>
                  
                  <p className="text-gray-600 text-sm pl-2 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {req.reason || "No details provided."}
                  </p>
                  
                  <p className="text-xs text-gray-400 font-medium pl-2 uppercase tracking-wide">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status]} uppercase tracking-wider`}>
      {status}
    </span>
  );
}