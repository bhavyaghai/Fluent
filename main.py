from flask import Flask, request, jsonify, send_file
from flask import render_template
import gensim.models.keyedvectors as word2vec
from gensim.similarities.index import AnnoyIndexer
from flask import jsonify
from numpy.linalg import norm
import pandas as pd
from sklearn.decomposition import PCA
from numpy.linalg import inv
import numpy as np
from gensim.models import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec
from termcolor import colored
from scipy.spatial.distance import cosine
import json
from datetime import datetime
import os
from difflib import get_close_matches
from flask import make_response
from nltk.corpus import stopwords
from functools import wraps, update_wrapper
import re
from py_thesaurus import Thesaurus
#from thesaurus import Word
import operator
import nltk
nltk.download('stopwords')


# Hyperparameters
g1_words = ['boy','man','he','father','son','guy','male','his','himself']
g2_words = ['girl','woman','she','mother','daughter','gal','female','her','herself']


app = Flask(__name__, static_url_path='', static_folder='', template_folder='')
# model : pretrained weighted model
# df : pandas dataframe (words & projections in 2D)
model, g, g1, g2 = None, None, None, None

def cos_sim(a, b):
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)


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
def setModel(name="Word2Vec"):
    global model, g, g1, g2
    print("Glove word embedding backend")
    model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.wikipedia.bin', binary=True, limit=50000)  
    g,g1,g2 = None,None,None
    return "success"


@app.route('/')
def index():
    setModel()
    groupBiasDirection_tolga()
    #groupBiasDirection()
    return render_template('index.html')

@app.route('/get_default_content')
def get_default_content():
    path = "./data/"
    data = None
    with open(path+'default_content.txt', 'r') as f:
        data = f.read()
    return data

@app.route('/controller')
def controller():
    text = request.args.get("text")
    print(text)
    if not text:
        print("Empty Text")
        return jsonify([])
    words = parseString(text)
    #return jsonify(get_bias_score(words))
    return jsonify(get_bias_score_tolga(words))

'''
# given a list of (word, index)
# return a dictionary with keys as words and 
# values as (starting_index, len of word, bias score)
def get_bias_score(word_list):
    out = []
    for w,ind in word_list:
        if w in model:
            gen_bias = round(cosine(g2,model[w])-cosine(g1,model[w]),5)
            out.append((w, ind, len(w), gen_bias))
        elif w.lower() in model:
            t = w.lower()
            gen_bias = round(cosine(g2,model[t])-cosine(g1,model[t]),5)
            out.append((w, ind, len(w), gen_bias))
        else:
            continue
    return out

def unit_vector(vec):
    return vec/norm(vec)

# calculate bias direction when we have group of words not pairs
def groupBiasDirection():
    global g1,g2
    print("Group bias direction !!!!!!!")
    dim = len(model["he"])
    g1,g2 = np.zeros((dim,), dtype=float), np.zeros((dim,), dtype=float)
    for p in g1_words:
        p = p.strip()
        if p not in model:
            continue
        p_vec = model[p]/norm(model[p])
        g1 = np.add(g1,p_vec)

    for q in g2_words:
        q = q.strip()
        if q not in model:
            continue
        q_vec = model[q]/norm(model[q])
        g2 = np.add(g2,q_vec) 

    g1, g2 = g1/norm(g1), g2/norm(g2)
    return "success"
'''

def groupBiasDirection_tolga():
    global g
    matrix = []
    pairs = zip(g1_words, g2_words)
    for a, b in pairs:
        center = (model[a] + model[b])/2
        matrix.append(model[a] - center)
        matrix.append(model[b] - center)
    matrix = np.array(matrix)
    pca = PCA(n_components = 10)
    pca.fit(matrix)
    g = list(pca.components_[0])
    return

def get_bias_score_tolga(word_list):
    out = []
    for w in word_list:
        if w in model:
            gen_bias = str(round(cos_sim(g,model[w]),5))
            out.append((w, gen_bias))
        elif w.lower() in model:
            t = w.lower()
            gen_bias = str(round(cos_sim(g,model[t]),5))
            out.append((w, gen_bias))
        else:
            continue
    return out

def get_bias_score_by_word(w):
    bias = None
    if w in model:
        bias = float(round(cos_sim(g,model[w]),5))
    elif w.lower() in model:
        t = w.lower()
        bias = float(round(cos_sim(g,model[t]),5))
    return bias

# normalize bias on a scale -1,1
# using hard coded values for max & min limits of bias
def normalize(b,bias_type):
    g_min, g_max = -0.30163, 0.30689
    r_min, r_max = -0.33754, 0.41024
    if bias_type=="gender":
        if b>0:
            return b/g_max
        else:
            return -1*(b/g_min)
    elif bias_type=="race":
        if b>0:
            return b/r_max
        else:
            return -1*(b/r_min)
    return "Invalid bias type !!!"


# Give an input string, extract words
# return list of words along with their starting index
def parseString(sentences):
    tar_words = list(set(re.findall(r"[\w']+", sentences)))
    out = []
    # filtering stop words
    # only removing neutral stopwords
    nltk_stopwords = stopwords.words('english') 
    gender_pronouns = ['he','him','his','himself','she',"she's",'her','hers','herself',]
    neutral_stopwords = [x for x in nltk_stopwords if x not in gender_pronouns]

    for word in tar_words:
        if word not in neutral_stopwords and not word.isdigit(): 
            #ind = re.search(r'\b({0})\b'.format(word), sentences).start()
            #out.append((word,ind))
            out.append(word)
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
    thresh_bias = json.loads(request.args.get("thresh"))
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