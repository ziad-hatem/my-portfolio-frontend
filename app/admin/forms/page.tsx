import { getForms } from "@/lib/form-actions";
import Link from "next/link";
import { Plus, ExternalLink, Activity } from "lucide-react";

export default async function FormsAdminPage() {
    const forms = await getForms();

    return (
        <div className="p-8 max-w-7xl mx-auto text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Form Manager</h1>
                    <p className="text-zinc-400 mt-1">Manage your generated forms and view submissions.</p>
                </div>
                <Link 
                    href="/generate-form" 
                    className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Create New Form
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                    <Link 
                        key={form.formId} 
                        href={`/admin/forms/${form.formId}`}
                        className="group bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">{form.name}</h2>
                                <p className="text-xs text-zinc-500 font-mono mt-1">ID: {form.formId}</p>
                            </div>
                            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                                <ExternalLink size={16} />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-green-500" />
                                <span className="text-white font-medium">{form.submissionCount}</span>
                                <span>submissions</span>
                            </div>
                            <div>
                                {new Date(form.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </Link>
                ))}

                {forms.length === 0 && (
                     <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                         <p className="text-zinc-500">No forms created yet.</p>
                     </div>
                )}
            </div>
        </div>
    );
}
