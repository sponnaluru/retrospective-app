from flask import Flask, render_template, request, redirect, url_for, session
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = '1234567890abcdef1234567890abcdef'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'
    
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_board', methods=['POST'])
def create_board():
   # Example of retrieving form data
    retro_type = request.form['retroType']
    team_size = request.form['teamSize']  # make sure these match your form input names

    # Logic to handle the data...
    # For example, storing the selected type in the session
    session['retro_type'] = retro_type
    return redirect(url_for('board'))

@app.route('/board')
def board():
    retro_type = session.get('retro_type', 'default_type')
    return render_template('board.html', retro_type=retro_type)

if __name__ == '__main__':
    app.run(debug=True)


migrate = Migrate(app, db)