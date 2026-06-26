let currentPin = '';
let allCandidates = [];
let invalidVotes = 0;

document.getElementById('login-btn').addEventListener('click', () => {
    const pin = document.getElementById('pin-input').value;
    if (!pin) return alert('Masukkan PIN!');
    currentPin = pin;
    fetchVotes(true);
});

async function fetchVotes(isLogin = false) {
    try {
        const response = await fetch('/api/votes');
        const data = await response.json();
        
        if (data.error) {
            alert("Error dari server: " + data.error);
        } else {
            allCandidates = data.candidates;
            invalidVotes = data.invalid_votes || 0;
            renderAdminPanel();
            if (isLogin) {
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('admin-panel').classList.remove('hidden');
            }
        }
    } catch (error) {
        alert("Gagal terhubung ke API. " + error.message);
    }
}

function renderAdminPanel() {
    const container = document.getElementById('admin-candidates-container');
    container.innerHTML = '';
    
    // Update invalid votes number
    const invalidEl = document.getElementById('invalid-votes-admin');
    if (invalidEl) invalidEl.textContent = invalidVotes;

    allCandidates.forEach((c, idx) => {
        const colorClass = idx === 0 ? 'text-[#00F0FF] border-[#00F0FF]/30' : 'text-[#FFD700] border-[#FFD700]/30';
        const btnClass = idx === 0 ? 'bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black' : 'bg-[#FFD700] hover:bg-[#FFD700]/80 text-black';
        
        container.innerHTML += `
            <div class="bg-gray-900 border ${colorClass} p-6 rounded-2xl flex flex-col relative">
                
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold ${colorClass.split(' ')[0]} mb-1">${c.name}</h2>
                    <div class="text-5xl font-black">${c.vote_count} <span class="text-lg text-gray-500 font-normal">Suara</span></div>
                </div>

                <div class="flex gap-4 mb-6">
                    <button onclick="voteFor(${c.id}, 'decrement')" class="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-4 rounded-xl text-xl transition-all active:scale-95">
                        -1
                    </button>
                    <button onclick="voteFor(${c.id}, 'increment')" class="flex-[3] w-full ${btnClass} font-bold py-4 rounded-xl text-xl transition-all active:scale-95 shadow-lg">
                        +1 BERI SUARA
                    </button>
                </div>

                <hr class="border-gray-800 my-4">
                
                <h3 class="text-sm text-gray-400 mb-3 font-bold uppercase tracking-wider">Edit Kandidat</h3>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Nama</label>
                        <input type="text" id="rename-${c.id}" value="${c.name}" class="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Link URL Foto</label>
                        <input type="text" id="photo-${c.id}" value="${c.photo_url || ''}" placeholder="https://..." class="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm">
                    </div>
                    <button onclick="updateCandidate(${c.id})" class="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors mt-2">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        `;
    });
}

async function voteFor(id, action) {
    try {
        const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, candidate_id: id, action: action })
        });
        const data = await res.json();
        if(!data.success) return alert(data.error);
        fetchVotes(); 
    } catch(e) { alert(e.message); }
}

async function voteInvalid(action) {
    try {
        const res = await fetch('/api/vote_invalid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, action: action })
        });
        const data = await res.json();
        if(!data.success) return alert(data.error);
        fetchVotes(); 
    } catch(e) { alert(e.message); }
}

async function updateCandidate(id) {
    const newName = document.getElementById(`rename-${id}`).value;
    const photoUrl = document.getElementById(`photo-${id}`).value;
    
    try {
        const res = await fetch('/api/update_candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, candidate_id: id, new_name: newName, photo_url: photoUrl })
        });
        const data = await res.json();
        if(!data.success) return alert(data.error);
        alert('Berhasil diperbarui!');
        fetchVotes(); 
    } catch(e) { alert(e.message); }
}

document.getElementById('reset-btn').addEventListener('click', async () => {
    if(confirm("YAKIN INGIN MERESET SEMUA SUARA KE 0? TINDAKAN INI SANGAT BERBAHAYA DAN TIDAK BISA DIBATALKAN!")) {
        // Minta PIN lagi untuk konfirmasi
        const pinConfirm = prompt("Masukkan kembali PIN Anda untuk mengonfirmasi penghapusan seluruh data:");
        
        if (pinConfirm === null) {
            return; // Dibatalkan oleh user
        }
        
        if (pinConfirm !== currentPin) {
            return alert("PIN YANG ANDA MASUKKAN SALAH! Proses reset dibatalkan demi keamanan.");
        }

        try {
            const res = await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pinConfirm })
            });
            const data = await res.json();
            if(!data.success) return alert(data.error);
            alert("SUARA BERHASIL DIRESET!");
            fetchVotes();
        } catch(e) { alert(e.message); }
    }
});

function exportToExcel() {
    if (allCandidates.length === 0) return alert("Belum ada data.");
    
    // Create CSV content
    const BOM = "\uFEFF"; // To fix Excel UTF-8 display issues
    let csv = BOM + "Laporan Hasil Perolehan Suara\n\n";
    
    let totalSah = 0;
    csv += "Kandidat,Jumlah Suara\n";
    allCandidates.forEach(c => {
        csv += `"${c.name}",${c.vote_count}\n`;
        totalSah += c.vote_count;
    });
    
    csv += `\n"Total Suara Sah",${totalSah}\n`;
    csv += `"Suara Tidak Sah",${invalidVotes}\n`;
    csv += `"TOTAL SUARA KESELURUHAN",${totalSah + invalidVotes}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Suara_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
