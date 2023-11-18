function addStickyNoteToSection(sectionId) {
    var section = document.getElementById(sectionId);
    var stickyNotesContainer = section.querySelector('.sticky-notes-container');
    var stickyNote = createStickyNote();
    stickyNotesContainer.appendChild(stickyNote);
    var content = 'New Note'; // Default content for a new note
    socket.emit('add_sticky_note', { content: content, board_id: boardId });
}

function createStickyNote(id = null, content = 'Add your comments') {
    var stickyNote = document.createElement('div');
    stickyNote.classList.add('sticky-note');
    stickyNote.contentEditable = true;
    stickyNote.setAttribute('draggable', true);
    stickyNote.id = id || 'sticky_' + Date.now();

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
    addStickyNoteToBoard(note.id, note.content);
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

// function addStickyNoteToSection(sectionId) {
//     var section = document.getElementById(sectionId);
//     var stickyNotesContainer = section.querySelector('.sticky-notes-container');
//     var stickyNote = createStickyNote();
//     stickyNotesContainer.appendChild(stickyNote);
// }

// function createStickyNote() {
//     var stickyNote = document.createElement('div');
//     stickyNote.classList.add('sticky-note');
//     stickyNote.contentEditable = true;
//     stickyNote.setAttribute('draggable', true); // Make the sticky note draggable
//     stickyNote.id = 'sticky_' + Date.now(); // Assign a unique ID

//     // Set up the dragstart event
//     stickyNote.addEventListener('dragstart', function (event) {
//         event.dataTransfer.setData('text/plain', stickyNote.id);
//     });

//     stickyNote.innerHTML = 'Add your comments'; // Placeholder text with a bullet point

//     stickyNote.addEventListener('focus', function (event) {
//         if (stickyNote.innerHTML.trim() === 'Add your comments') {
//             stickyNote.innerHTML = '<div>•&nbsp;</div>'; // Start with a bullet point on a new line
//             setCaretToEnd(stickyNote); // Set caret after the bullet point
//         }
//     });

//     stickyNote.addEventListener('blur', function (event) {
//         if (!stickyNote.textContent.trim()) {
//             stickyNote.innerHTML = 'Add your comments'; // Re-add placeholder text with a bullet point
//         }
//     });

//     stickyNote.addEventListener('keydown', function (event) {
//         // Check if the Enter key is pressed
//         if (event.key === 'Enter') {
//             event.preventDefault(); // Prevent the default enter behavior
//             var selection = window.getSelection();
//             var range = selection.getRangeAt(0);
//             range.deleteContents(); // Delete the current selection

//             // Create a new div with a bullet point
//             var div = document.createElement('div');
//             div.innerHTML = '•&nbsp;';
//             range.insertNode(div);

//             // Move the caret to the new line
//             range.selectNodeContents(div);
//             range.collapse(false);
//             selection.removeAllRanges();
//             selection.addRange(range);
//         }
//     });

//     return stickyNote;
// }

// // This function sets the caret to the end of the contenteditable container
// function setCaretToEnd(contentEditableElement) {
//     var range = document.createRange();
//     var selection = window.getSelection();
//     range.selectNodeContents(contentEditableElement);
//     range.collapse(false);
//     selection.removeAllRanges();
//     selection.addRange(range);
//     contentEditableElement.focus();
// }

// function enableDropZones() {
//     var dropZones = document.querySelectorAll('.sticky-notes-container');

//     dropZones.forEach(function (dropZone) {
//         // Set up the dragover event
//         dropZone.addEventListener('dragover', function (event) {
//             event.preventDefault(); // Necessary to allow a drop
//             // Optional: Add some visual feedback
//         });

//         // Set up the drop event
//         dropZone.addEventListener('drop', function (event) {
//             event.preventDefault(); // Prevent default behavior
//             var id = event.dataTransfer.getData('text/plain');
//             var draggableElement = document.getElementById(id);
//             dropZone.appendChild(draggableElement);
//             // Optional: Remove visual feedback
//         });
//     });
// }

// var socket = io.connect(window.location.origin);

// socket.on('connect', function () {
//     // Join the board room
//     socket.emit('join_board', { board_id: boardId });
// });

// socket.on('board_updated', function(data) {
//     // Assuming data has noteId, content, and position
//     let note = document.getElementById(data.noteId);
//     if (!note) {
//         // If the note doesn't exist, create it
//         note = document.createElement('div');
//         note.id = data.noteId;
//         note.classList.add('sticky-note');
//         note.contentEditable = true;
//         document.querySelector('.board-container').appendChild(note);  // Adjust this selector based on your HTML structure
//     }

//     // Update the note's content and position
//     note.innerText = data.content;
//     note.style.left = data.position.x + 'px';
//     note.style.top = data.position.y + 'px';
// });


// function sendBoardUpdate(updateData) {
//     socket.emit('update_board', { board_id: boardId, ...updateData });
// }

// window.onload = function () {
//     enableDropZones();
// };