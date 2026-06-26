let candidatesState = {}; // Store previous state to animate only when changed

async function fetchVotes() {
    try {
        const response = await fetch('/api/votes');
        const data = await response.json();
        
        if (data.error) {
            showError("Error dari server: " + data.error);
        } else {
            renderCandidates(data.candidates);
        }
    } catch (error) {
        showError("Gagal terhubung ke API. " + error.message);
    }
}

function showError(message) {
    const container = document.getElementById('candidates-container');
    container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center text-red-500 bg-red-900/20 p-4 rounded-xl border border-red-500/50 font-bold">${message}<br><br><span class="text-sm text-gray-400 font-normal">Pastikan Anda sudah memasukkan DATABASE_URL di Environment Variables Vercel dan men-deploy ulang.</span></div>`;
}

function renderCandidates(candidates) {
    if (!candidates) return;
    const container = document.getElementById('candidates-container');
    
    // First time render
    if (container.children.length === 1 && container.children[0].classList.contains('animate-pulse')) {
        container.innerHTML = '';
    }

    candidates.forEach((candidate, index) => {
        let card = document.getElementById(`candidate-${candidate.id}`);
        
        if (!card) {
            // Create new card from template
            const template = document.getElementById('candidate-template');
            const clone = template.content.cloneNode(true);
            
            card = clone.querySelector('.candidate-card');
            card.id = `candidate-${candidate.id}`;
            
            card.querySelector('.candidate-name').textContent = candidate.name;
            
            // Add vote button listener
            const btn = card.querySelector('.vote-btn');
            btn.onclick = () => voteFor(candidate.id);
            
            container.appendChild(clone);
            
            // Re-fetch card after appending
            card = document.getElementById(`candidate-${candidate.id}`);
            candidatesState[candidate.id] = 0;
        }

        // Update vote count if changed
        if (candidatesState[candidate.id] !== candidate.vote_count) {
            const voteCountEl = card.querySelector('.vote-count');
            voteCountEl.textContent = candidate.vote_count;
            
            // Add animation class
            voteCountEl.classList.remove('number-update-anim');
            void voteCountEl.offsetWidth; // trigger reflow
            voteCountEl.classList.add('number-update-anim');
            
            updateTally(card.querySelector('.tally-container'), candidate.vote_count);
            
            candidatesState[candidate.id] = candidate.vote_count;
        }
    });
}

function updateTally(container, totalVotes) {
    container.innerHTML = '';
    
    const bundles = Math.floor(totalVotes / 5);
    const remainder = totalVotes % 5;
    
    // Create full bundles (5 votes each)
    for (let i = 0; i < bundles; i++) {
        const bundleEl = document.createElement('div');
        bundleEl.className = 'tally-bundle';
        
        for (let j = 0; j < 4; j++) {
            const mark = document.createElement('div');
            mark.className = 'tally-mark';
            bundleEl.appendChild(mark);
        }
        
        // 5th mark is the cross
        const crossMark = document.createElement('div');
        crossMark.className = 'tally-mark cross';
        bundleEl.appendChild(crossMark);
        
        container.appendChild(bundleEl);
    }
    
    // Create remainder marks
    if (remainder > 0) {
        const remainderBundle = document.createElement('div');
        remainderBundle.className = 'tally-bundle';
        
        for (let i = 0; i < remainder; i++) {
            const mark = document.createElement('div');
            mark.className = 'tally-mark';
            remainderBundle.appendChild(mark);
        }
        container.appendChild(remainderBundle);
    }
}

async function voteFor(candidateId) {
    try {
        await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidate_id: candidateId })
        });
        
        // Immediately fetch to show update fast
        fetchVotes();
    } catch (error) {
        console.error("Error voting:", error);
    }
}

// Initial fetch
fetchVotes();

// Poll every 1 second for live updates
setInterval(fetchVotes, 1000);
