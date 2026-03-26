# server.py

from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Display importation metrics"""
    metrics = {
        'total_imports': 120,
        'successful_imports': 115,
        'failed_imports': 5,
    }
    return jsonify(metrics)

if __name__ == '__main__':
    app.run(debug=True)