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
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('join_board')
def on_join(data):
    room = data['board_id']
    join_room(room)
    # emit('status', {'msg': f'Someone has joined the board {room}.'}, room=room)

@socketio.on('update_board')
def on_update_board(data):
    room = data['board_id']
    emit('board_updated', data, room=room, include_self=False)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_board', methods=['POST'])
def create_board():
# Example of retrieving form data
    retro_type = request.form['retroType']
    team_size = request.form['teamSize']  # make sure these match your form input names
    session['retro_type'] = retro_type
    unique_id = str(uuid4())
    return redirect(url_for('board', board_id=unique_id))

@app.route('/board/<board_id>')
def board(board_id):
    return render_template('board.html', board_id=board_id)

@app.route('/board')
def board_defaukt():
    retro_type = session.get('retro_type', 'default_type')
    return render_template('board.html', retro_type=retro_type)

if __name__ == '__main__':
    app.run(debug=True)

migrate = Migrate(app, db)