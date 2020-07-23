from flask import Flask, request, jsonify, send_file, render_template
#import gensim.models.keyedvectors as word2vec
#from gensim.similarities.index import AnnoyIndexer
from flask import jsonify
from numpy.linalg import norm
import numpy as np
from gensim.models import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec
from scipy.spatial.distance import cosine
import json
from datetime import datetime
import os
#from difflib import get_close_matches
from flask import make_response
from functools import wraps, update_wrapper
import re
from py_thesaurus import Thesaurus
#from thesaurus import Word
#import nltk
#nltk.download('stopwords')
from sklearn import svm
import sys
import pickle


app = Flask(__name__, static_url_path='', static_folder='', template_folder='')

# classifier
clf, lookup = None, None


def cos_sim(a, b):
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

# given two words 'string' -> returns their phonetic similarity
def pcosine(w1, w2):
    w1, w2 = w1.upper(), w2.upper()
    return 1-cosine(lookup[w1], lookup[w2])

# prevent caching
def nocache(view):
    @wraps(view)
    def no_cache(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Last-Modified'] = datetime.now()
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response
    return update_wrapper(no_cache, view)


@app.route('/setModel/<name>')
def load_word_embd_model(name="Word2Vec"):
    global model
    print("Glove word embedding backend")
    model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.wikipedia.bin', binary=True, limit=50000)  
    return "success"

def load_phonetic_embedding():
    global lookup
    # read phonetic embedding pickle file
    path = "./data/"
    with open(path+'phonetic_embd.pickle', 'rb') as handle:
        lookup = pickle.load(handle)
    print("Phonetic embedding loaded !")
    return "success"


@app.route('/')
def index():
    load_word_embd_model()
    load_phonetic_embedding()
    #groupBiasDirection()
    return render_template('index.html')


@app.route('/get_default_content')
def get_default_content():
    path = "./data/"
    data = None
    with open(path+'default_content.txt', 'r') as f:
        data = f.read()
    return data


@app.route('/update')
def update():
    text = request.args.get("text")
    easy = request.args.get("easy")
    diff = request.args.get("diff")
    thresh = float(request.args.get("thresh"))/100

    if not text:
        print("Empty Text")
        return jsonify([])

    words = parseString(text)
    res = get_hard_words(easy, diff, thresh, words)
    print("res: ", res)
    return jsonify(res)


def get_hard_words(easy, diff, thresh, text_words):
    easy = easy.split(",")
    difficult = diff.split(",")

    print("easy words: ", easy)
    print("difficult words: ", difficult)
    print("thresh: ", thresh)

    X, y = [], []
    for w in easy:
        word = w.upper()
        if word in lookup:
            X.append(lookup[word])
            y.append(0)
            
    for w in difficult:
        word = w.upper()
        if word in lookup:
            X.append(lookup[word])
            y.append(1)

    print("len X: ", len(X))
    print("len y: ", len(y))
    clf = svm.SVC(probability=True, random_state=0)
    clf.fit(X, y)
    
    res = []
    for w in text_words:
        w = w.upper()
        if w not in lookup:
            continue
        vec = lookup[w]
        p = round(clf.predict_proba([vec])[0][1],2)
        #print("word: ", w, "  p val: ",p)
        if p>=thresh:
            res.append((w,p))
    #pred = clf.predict_proba(list(lookup.values()))
    #res_words = np.array(list(lookup.keys()))[pred[:,1]>thresh]
    return res


# Give an input string, extract words
# return list of words along with their starting index
def parseString(sentences):
    tar_words = list(set(re.findall(r"[\w']+", sentences)))
    out = []
    # filtering stop words
    # only removing neutral stopwords
    #nltk_stopwords = stopwords.words('english') 

    for word in tar_words:
        if not word.isdigit(): 
            #ind = re.search(r'\b({0})\b'.format(word), sentences).start()
            #out.append((word,ind))
            out.append(word)
    out = list(set(out))
    print(out)
    return out


''' 
# We have used two sources to get alternates: thesaurus and word embedding
# To evaluate best alternates, we have two metrics: similarity sscore & bias score
# we want words with high similarity & least bias (at least lesser than initial bias)
# Based on empirical study of few sample words, We assume that synoyms produced by thesaurus are better than
the ones prduced by word embeddings.
# Hence synonyms from thesaurus are discarded only when its correspoding bias score is greater than initial bias
or the word is not present in word embedding model
Furthermore, Thesaurus doesn't provide any quantitative score for the synonyms so its difficult to compare similarity.

# For synonyms extracted from word embedding, we compare bias score and similarity score
# Ideally, we should find pareto optimal front to find word with highest similarity & least bias
# In our case, we consider all synonyms whose similarity>threshold and whose bias score is less than initial bias
# finally, we sort by bias and discard words with higher bias

'''
@app.route('/alternates/<name>')
def alternates(name):
    max_results = 5
    #thresh_bias = json.loads(request.args.get("thresh"))
    thresh_bias = 0.1
    neigh_thesau = {}
    neigh = None
    try:
        w = Word(name)
        neigh = w.synonyms()
    except:
        print("Not Found in Thesaurus !!!")
    
    # if synonyms for the word are available
    if neigh:
        for x in neigh:
            if x not in model:
                continue
            word_bias = abs(get_bias_score_by_word(x))
            if word_bias<thresh_bias:
                neigh_thesau[x] = word_bias
    # if we get sufficient results from thesaurus return them (skip synonyms from word embedding)
    if len(neigh_thesau)>=max_results:
        neigh_thesau = sorted(neigh_thesau.items(), key=lambda kv: kv[1])
        res = neigh_thesau[:max_results]
        return jsonify(res)
    
    neigh_embd = {}
    synonym_limit_embedding = 2*max_results
    min_semantic_sim = 0.60
    if name in model:
        neigh = model.similar_by_word(name, topn=synonym_limit_embedding)
    else:
        neigh = model.similar_by_word(name.lower(), topn=synonym_limit_embedding)
    
    for w,sim in neigh:
        word_bias = abs(get_bias_score_by_word(w))
        # If word is not already counted by thesaurus &
        # word semantic similarity is greater than some threshold &
        # bias score of synonym is less than the specific word
        if sim<min_semantic_sim:
            break
        if w not in neigh_thesau and word_bias<thresh_bias:
            neigh_embd[w] = word_bias
    
    neigh_thesau = sorted(neigh_thesau.items(), key=lambda kv: kv[1])
    more_needed = max_results-len(neigh_thesau)
    #print(more_needed)
    
    neigh_embd = sorted(neigh_embd.items(), key=lambda kv: kv[1])
    res = neigh_thesau + neigh_embd[:more_needed]
    #sorted_res = sorted(res.items(), key=lambda value: value[1])
    return jsonify(res)


# get list of filenames for group & target folder
@app.route('/getFileNames/')
def getFileNames():
    tar_path = './data/wordList/target'
    gp_path = './data/wordList/groups'
    target = os.listdir(tar_path)
    group = os.listdir(gp_path)
    return jsonify([group,target])

if __name__ == '__main__':
   app.run(port=5999, debug=True)