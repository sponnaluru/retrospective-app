function addStickyNoteToSection(sectionId) {
    var section = document.getElementById(sectionId);
    var stickyNotesContainer = section.querySelector('.sticky-notes-container');
    var stickyNote = createStickyNote();
    stickyNotesContainer.appendChild(stickyNote);
}

function createStickyNote() {
    var stickyNote = document.createElement('div');
    stickyNote.classList.add('sticky-note');
    stickyNote.contentEditable = true;
    stickyNote.setAttribute('draggable', true); // Make the sticky note draggable
    stickyNote.id = 'sticky_' + Date.now(); // Assign a unique ID

    // Set up the dragstart event
    stickyNote.addEventListener('dragstart', function(event) {
        event.dataTransfer.setData('text/plain', stickyNote.id);
    });

    stickyNote.innerHTML = 'Add your comments'; // Placeholder text with a bullet point

    stickyNote.addEventListener('focus', function(event) {
        if (stickyNote.innerHTML.trim() === 'Add your comments') {
            stickyNote.innerHTML = '<div>•&nbsp;</div>'; // Start with a bullet point on a new line
            setCaretToEnd(stickyNote); // Set caret after the bullet point
        }
    });

    stickyNote.addEventListener('blur', function(event) {
        if (!stickyNote.textContent.trim()) {
            stickyNote.innerHTML = 'Add your comments'; // Re-add placeholder text with a bullet point
        }
    });

    stickyNote.addEventListener('keydown', function(event) {
        // Check if the Enter key is pressed
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent the default enter behavior
            var selection = window.getSelection();
            var range = selection.getRangeAt(0);
            range.deleteContents(); // Delete the current selection

            // Create a new div with a bullet point
            var div = document.createElement('div');
            div.innerHTML = '•&nbsp;';
            range.insertNode(div);

            // Move the caret to the new line
            range.selectNodeContents(div);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    return stickyNote;
}

// This function sets the caret to the end of the contenteditable container
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

    dropZones.forEach(function(dropZone) {
        // Set up the dragover event
        dropZone.addEventListener('dragover', function(event) {
            event.preventDefault(); // Necessary to allow a drop
            // Optional: Add some visual feedback
        });

        // Set up the drop event
        dropZone.addEventListener('drop', function(event) {
            event.preventDefault(); // Prevent default behavior
            var id = event.dataTransfer.getData('text/plain');
            var draggableElement = document.getElementById(id);
            dropZone.appendChild(draggableElement);
            // Optional: Remove visual feedback
        });
    });
}
