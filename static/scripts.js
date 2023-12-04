function addStickyNoteToSection(sectionId) {
    var noteId = 'sticky_' + Date.now(); // Unique ID for the sticky note
    var noteContent = 'Add your comments'; // Default content for a new note

    // Emit an event to the server to add the note
    socket.emit('add_sticky_note', {
        id: noteId, 
        content: noteContent, 
        board_id: boardId,
        section_id: sectionId
    });

}

function createStickyNote(id, content, sectionId) {
    var stickyNote = document.createElement('div');
    stickyNote.classList.add('sticky-note');
    stickyNote.contentEditable = true;
    stickyNote.setAttribute('draggable', true);
    stickyNote.id = id;
    stickyNote.setAttribute('data-section-id', sectionId);

    // Create delete button
    var deleteBtn = document.createElement('span');
    deleteBtn.innerHTML = '&times;'; 
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = function() {
        if (confirm('Are you sure you want to delete this note?')) {
            socket.emit('delete_sticky_note', { id: id, board_id: boardId });
        }
    };
    stickyNote.appendChild(deleteBtn);

    // Create a container for the content and add it to the sticky note
    var contentContainer = document.createElement('div');
    contentContainer.innerHTML = content;
    stickyNote.appendChild(contentContainer);

    // Drag start event listener
    stickyNote.addEventListener('dragstart', function(event) {
        event.dataTransfer.setData('text/plain', stickyNote.id);
    });

    // Focus event listener
    stickyNote.addEventListener('focus', function(event) {
        if (contentContainer.innerHTML.trim() === 'Add your comments') {
            contentContainer.innerHTML = '<div>•&nbsp;</div>';
            setCaretToEnd(contentContainer);
        }
    });

    // Blur event listener
    stickyNote.addEventListener('blur', function(event) {
        if (!contentContainer.textContent.trim()) {
            contentContainer.innerHTML = 'Add your comments';
        }
    });

    // Keydown event listener
    stickyNote.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            var selection = window.getSelection();
            var range = selection.getRangeAt(0);
            range.deleteContents();

            var div = document.createElement('div');
            div.innerHTML = '•&nbsp;';
            range.insertNode(div);

            range.selectNodeContents(div);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    // Input event listener
    stickyNote.addEventListener('input', function(event) {
        socket.emit('update_sticky_note', { 
            id: stickyNote.id, 
            content: contentContainer.innerHTML, 
            board_id: boardId, 
            section_id: sectionId 
        });
    });

    return stickyNote;
}

function setCaretToEnd(contentEditableElement) {
    var range = document.createRange();
    var selection = window.getSelection();
    range.selectNodeContents(contentEditableElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    contentEditableElement.focus();
}

function enableDropZones() {
    var dropZones = document.querySelectorAll('.sticky-notes-container');

    dropZones.forEach(function (dropZone) {
        dropZone.addEventListener('dragover', function (event) {
            event.preventDefault();
        });

        dropZone.addEventListener('drop', function (event) {
            event.preventDefault();
            var id = event.dataTransfer.getData('text/plain');
            var draggableElement = document.getElementById(id);
            dropZone.appendChild(draggableElement);

            const newSectionId = dropZone.parentElement.id;
            socket.emit('move_sticky_note', { id: draggableElement.id, section_id: newSectionId, board_id: boardId });
        });
    });
}

function exportToPDF() {
    var element = document.querySelector('.retro-board');
    var header = document.getElementById('pdf-header');
    var urlSpan = document.getElementById('page-url');
    urlSpan.textContent = window.location.href; // Set the current URL
    header.style.display = 'block'; // Make the header visible for the PDF
  
    var opt = {
      margin: 1,
      filename: 'retrospective.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
  
    html2pdf().from(element).set(opt).save().then(function() {
      header.style.display = 'none'; // Hide the header again after exporting
    });
  }

var socket = io.connect(window.location.origin);

socket.on('connect', function () {
    socket.emit('join_board', { board_id: boardId });
});

socket.on('load_sticky_notes', function(notes) {
    notes.forEach(function(note) {
        addStickyNoteToBoard(note.id, note.content, note.section_id);
    });
});


socket.on('sticky_note_added', function(note) {
    if (!document.getElementById(note.section_id)) {
        console.error('Invalid section ID:', note.section_id);
        return; // Exit if the section ID is invalid
    }

    var existingNote = document.getElementById(note.id);
    if (!existingNote) {
        addStickyNoteToBoard(note.id, note.content, note.section_id);
    }
});


socket.on('sticky_note_updated', function(note) {
    var existingNote = document.getElementById(note.id);
    if (existingNote) {
        existingNote.innerHTML = note.content;
    }
});

function addStickyNoteToBoard(id, content, sectionId) {
    var section = document.getElementById(sectionId);
    if (!section) {
        console.error('Section not found:', sectionId);
        return; // Exit if the section is not found
    }
    var stickyNotesContainer = section.querySelector('.sticky-notes-container');
    var stickyNote = createStickyNote(id, content, sectionId);
    stickyNotesContainer.appendChild(stickyNote);
}

function deleteStickyNote(noteId) {
    socket.emit('delete_sticky_note', { id: noteId, board_id: boardId });
}

function setupDeleteButtonListeners() {
    var deleteButtons = document.querySelectorAll('.delete-note');
    deleteButtons.forEach(function(button) {
        button.onclick = function() {
            var noteId = button.getAttribute('data-note-id');
            if (confirm('Are you sure you want to delete this note?')) {
                socket.emit('delete_sticky_note', { id: noteId, board_id: boardId });
            }
        };
    });
}

socket.on('sticky_note_deleted', function(data) {
    const noteToDelete = document.getElementById(data.id);
    if (noteToDelete) {
        noteToDelete.remove();
    }
});

socket.on('sticky_note_section_updated', function(data) {
       const stickyNote = document.getElementById(data.id);
       const newContainer = document.getElementById(data.section_id).querySelector('.sticky-notes-container');
   
       // Move the sticky note to the new container
       if (stickyNote && newContainer) {
           newContainer.appendChild(stickyNote);
       }
});


window.onload = function () {
    enableDropZones();
    setupDeleteButtonListeners();
};