from flask import Flask, render_template, request, redirect, url_for, session
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_cors import CORS
from uuid import uuid4

app = Flask(__name__)
app.secret_key = '1234567890abcdef1234567890abcdef'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

class StickyNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500))
    board_id = db.Column(db.String(36))
    section_id = db.Column(db.String(100))  # New column for section ID

@socketio.on('add_sticky_note')
def handle_add_sticky_note(data):
    content = data['content']
    board_id = data['board_id']
    section_id = data.get('section_id', 'default_section')  # Get section ID from the data, or use a default

    new_note = StickyNote(content=content, board_id=board_id, section_id=data['section_id'])
    db.session.add(new_note)
    db.session.commit()

    emit('sticky_note_added', {
        'id': new_note.id, 
        'content': content, 
        'board_id': board_id, 
        'section_id': section_id
    }, room=board_id)


@socketio.on('update_sticky_note')
def handle_update_sticky_note(data):
    note_id = data['id']
    content = data['content']
    board_id = data['board_id']
    note = StickyNote.query.get(note_id)
    if note:
        note.content = content
        db.session.commit()
        emit('sticky_note_updated', data, room=board_id, include_self=False)
        #emit('sticky_note_updated', {'id': note_id, 'content': content}, room=note.board_id)

# @socketio.on('delete_sticky_note')
# def handle_delete_sticky_note(data):
#     note_id = data['id']
#     note = StickyNote.query.get(note_id)
#     if note:
#         db.session.delete(note)
#         db.session.commit()
#         emit('sticky_note_deleted', {'id': note_id}, room=note.board_id)    

@socketio.on('move_sticky_note')
def handle_move_sticky_note(data):
    note_id = data['id']
    new_section = data['section_id']
    note = StickyNote.query.get(note_id)
    if note:
        note.section_id = new_section
        db.session.commit()
        emit('sticky_note_section_updated', {'id': note_id, 'section_id': new_section}, room=note.board_id, include_self=False)
    
@socketio.on('join_board')
def on_join(data):
    room = data['board_id']
    join_room(room)
    notes = StickyNote.query.filter_by(board_id=room).all()
    notes_data = [{'id': note.id, 'content': note.content, 'section_id': note.section_id} for note in notes]
    emit('load_sticky_notes', notes_data, room=request.sid)


@socketio.on('update_board')
def on_update_board(data):
    room = data['board_id']
    emit('board_updated', data, room=room, include_self=False)

@socketio.on('delete_sticky_note')
def handle_delete_sticky_note(data):
    note_id = data['id']
    board_id = data['board_id']
    note = StickyNote.query.get(note_id)
    if note:
        db.session.delete(note)
        db.session.commit()
        emit('sticky_note_deleted', {'id': note_id}, room=board_id)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_board', methods=['POST'])
def create_board():
# Example of retrieving form data
    retro_type = request.form['retroType']
    # team_size = request.form['teamSize']  # make sure these match your form input names
    session['retro_type'] = retro_type
    unique_id = str(uuid4())
    return redirect(url_for('board', board_id=unique_id, retro_type=retro_type))

@app.route('/board/<board_id>/<retro_type>')
def board(board_id, retro_type):
    return render_template(f'{retro_type}_board.html', board_id=board_id)

@app.route('/board')
def board_defaukt():
    retro_type = session.get('retro_type', 'default_type')
    return render_template('board.html', retro_type=retro_type)

if __name__ == '__main__':
    socketio.run(app, debug=True)