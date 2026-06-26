let candidatesState = {}; 

async function fetchVotes() {
    try {
        const response = await fetch('/api/votes');
        const data = await response.json();
        
        if (data.error) {
            showError("Error dari server: " + data.error);
        } else {
            renderCandidates(data.candidates);
            updateGlobalStats(data.candidates, data.invalid_votes);
        }
    } catch (error) {
        showError("Gagal terhubung ke API. " + error.message);
    }
}

function showError(message) {
    const container = document.getElementById('candidates-container');
    container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center text-red-500 bg-red-900/20 p-4 rounded-xl border border-red-500/50 font-bold">${message}</div>`;
}

function updateGlobalStats(candidates, invalidVotes) {
    if (candidates.length < 2) return;
    
    const v1 = candidates[0].vote_count;
    const v2 = candidates[1].vote_count;
    const total = v1 + v2;
    
    // Update Total Big Number
    document.getElementById('total-all-votes').textContent = total;
    
    // Update Invalid Votes Big Number
    const invalidEl = document.getElementById('invalid-votes-count');
    if (invalidEl) invalidEl.textContent = invalidVotes || 0;
    
    // Update Progress Bar
    const container = document.getElementById('progress-bar-container');
    container.classList.remove('opacity-0');
    
    const p1 = document.getElementById('progress-c1');
    const p2 = document.getElementById('progress-c2');
    
    let pct1 = 0; let pct2 = 0;
    if (total === 0) {
        p1.style.width = '50%'; p1.textContent = '0%';
        p2.style.width = '50%'; p2.textContent = '0%';
    } else {
        pct1 = Math.round((v1 / total) * 100);
        pct2 = 100 - pct1;
        p1.style.width = `${pct1}%`; p1.textContent = `${pct1}%`;
        p2.style.width = `${pct2}%`; p2.textContent = `${pct2}%`;
    }
    
    // Update percentage text under names
    const card1 = document.getElementById(`candidate-${candidates[0].id}`);
    const card2 = document.getElementById(`candidate-${candidates[1].id}`);
    if (card1) card1.querySelector('.candidate-pct').textContent = `${pct1}%`;
    if (card2) card2.querySelector('.candidate-pct').textContent = `${pct2}%`;
}

function renderCandidates(candidates) {
    if (!candidates) return;
    const container = document.getElementById('candidates-container');
    
    if (container.children.length === 1 && container.children[0].classList.contains('animate-pulse')) {
        container.innerHTML = '';
    }

    candidates.forEach((candidate) => {
        let card = document.getElementById(`candidate-${candidate.id}`);
        
        if (!card) {
            const template = document.getElementById('candidate-template');
            const clone = template.content.cloneNode(true);
            
            card = clone.querySelector('.candidate-card');
            card.id = `candidate-${candidate.id}`;
            container.appendChild(clone);
            card = document.getElementById(`candidate-${candidate.id}`);
            candidatesState[candidate.id] = { votes: -1 };
        }
        
        // Update Name
        card.querySelector('.candidate-name').textContent = candidate.name;
        
        // Update Photo
        const photoImg = card.querySelector('.candidate-photo');
        const placeholder = card.querySelector('.photo-placeholder');
        if (candidate.photo_url && candidate.photo_url.trim() !== '') {
            photoImg.src = candidate.photo_url;
            photoImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            photoImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }

        // Update vote count
        if (candidatesState[candidate.id].votes !== candidate.vote_count) {
            const voteCountEl = card.querySelector('.vote-count');
            voteCountEl.textContent = candidate.vote_count;
            
            voteCountEl.classList.remove('number-update-anim');
            void voteCountEl.offsetWidth; // trigger reflow
            voteCountEl.classList.add('number-update-anim');
            
            updateTally(card.querySelector('.tally-container'), candidate.vote_count);
            candidatesState[candidate.id].votes = candidate.vote_count;
        }
    });
}

function updateTally(container, totalVotes) {
    container.innerHTML = '';
    const bundles = Math.floor(totalVotes / 5);
    const remainder = totalVotes % 5;
    
    for (let i = 0; i < bundles; i++) {
        const bundleEl = document.createElement('div');
        bundleEl.className = 'tally-bundle';
        for (let j = 0; j < 4; j++) {
            const mark = document.createElement('div');
            mark.className = 'tally-mark';
            bundleEl.appendChild(mark);
        }
        const crossMark = document.createElement('div');
        crossMark.className = 'tally-mark cross';
        bundleEl.appendChild(crossMark);
        container.appendChild(bundleEl);
    }
    
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

// Initial fetch
fetchVotes();
setInterval(fetchVotes, 1000);
