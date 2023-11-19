function addStickyNoteToSection(sectionId) {
    var noteId = 'sticky_' + Date.now(); // Unique ID for the sticky note
    var noteContent = 'Add your comments'; // Default content for a new note

    // Emit an event to the server to add the note
    socket.emit('add_sticky_note', {
        id: noteId, 
        content: noteContent, 
        board_id: boardId
    });

}

function createStickyNote(id, content) {
    var stickyNote = document.createElement('div');
    stickyNote.classList.add('sticky-note');
    stickyNote.contentEditable = true;
    stickyNote.setAttribute('draggable', true);
    stickyNote.id = id;

    stickyNote.addEventListener('dragstart', function (event) {
        event.dataTransfer.setData('text/plain', stickyNote.id);
    });

    stickyNote.innerHTML = content;

    stickyNote.addEventListener('focus', function (event) {
        if (stickyNote.innerHTML.trim() === 'Add your comments') {
            stickyNote.innerHTML = '<div>•&nbsp;</div>';
            setCaretToEnd(stickyNote);
        }
    });

    stickyNote.addEventListener('blur', function (event) {
        if (!stickyNote.textContent.trim()) {
            stickyNote.innerHTML = 'Add your comments';
        }
    });

    stickyNote.addEventListener('keydown', function (event) {
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

    stickyNote.addEventListener('input', function(event) {
        socket.emit('update_sticky_note', { id: stickyNote.id, content: stickyNote.innerHTML, board_id: boardId });
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
        });
    });
}

var socket = io.connect(window.location.origin);

socket.on('connect', function () {
    socket.emit('join_board', { board_id: boardId });
});

socket.on('load_sticky_notes', function(notes) {
    notes.forEach(function(note) {
        addStickyNoteToBoard(note.id, note.content);
    });
});

socket.on('sticky_note_added', function(note) {
    var existingNote = document.getElementById(note.id);
    if (!existingNote) {
        addStickyNoteToBoard(note.id, note.content);
    }
});


socket.on('sticky_note_updated', function(note) {
    var existingNote = document.getElementById(note.id);
    if (existingNote) {
        existingNote.innerHTML = note.content;
    }
});

function addStickyNoteToBoard(id, content) {
    var section = document.getElementById('appreciate'); // Replace with your default section ID
    var stickyNotesContainer = section.querySelector('.sticky-notes-container');
    var stickyNote = createStickyNote(id, content);
    stickyNotesContainer.appendChild(stickyNote);
}

window.onload = function () {
    enableDropZones();
};