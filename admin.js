let currentPin = '';
let allCandidates = [];

document.getElementById('login-btn').addEventListener('click', () => {
    const pin = document.getElementById('pin-input').value;
    if (!pin) return alert('Masukkan PIN!');
    currentPin = pin;
    
    // Test fetch
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

    allCandidates.forEach((c, idx) => {
        const colorClass = idx === 0 ? 'text-[#00F0FF] border-[#00F0FF]/30' : 'text-[#FFD700] border-[#FFD700]/30';
        const btnClass = idx === 0 ? 'bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30' : 'bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30';
        
        container.innerHTML += `
            <div class="bg-gray-900 border ${colorClass} p-6 rounded-2xl flex flex-col relative">
                
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold ${colorClass.split(' ')[0]} mb-1">${c.name}</h2>
                    <div class="text-5xl font-black">${c.vote_count} <span class="text-lg text-gray-500 font-normal">Suara</span></div>
                </div>

                <button onclick="voteFor(${c.id})" class="w-full ${btnClass} font-bold py-4 rounded-xl text-xl mb-6 transition-all active:scale-95">
                    +1 BERI SUARA
                </button>

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

async function voteFor(id) {
    try {
        const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, candidate_id: id })
        });
        const data = await res.json();
        if(!data.success) return alert(data.error);
        fetchVotes(); // refresh
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
        fetchVotes(); // refresh
    } catch(e) { alert(e.message); }
}

document.getElementById('reset-btn').addEventListener('click', async () => {
    if(confirm("YAKIN INGIN MERESET SEMUA SUARA KE 0? TINDAKAN INI TIDAK BISA DIBATALKAN!")) {
        try {
            const res = await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: currentPin })
            });
            const data = await res.json();
            if(!data.success) return alert(data.error);
            alert("SUARA BERHASIL DIRESET!");
            fetchVotes();
        } catch(e) { alert(e.message); }
    }
});
