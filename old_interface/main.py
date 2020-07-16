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
from thesaurus import Word
import nltk
nltk.download('stopwords')


app = Flask(__name__, static_url_path='', static_folder='', template_folder='')
# model : pretrained weighted model
# df : pandas dataframe (words & projections in 2D)
model, g, g1, g2, g3, g4, df_proj = None, None, None, None, None, None, None
deb_high = {}   # debiased points in high dim space

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


@app.route('/get_proj_csv/')
def get_proj_csv():
    global df_proj
    out = df_proj.to_json(orient='records')
    return out

initialwords = []

@app.route('/setModel/<name>')
def setModel(name="Word2Vec"):
    global model, df, g, g1, g2, deb_high, initialwords
    if name=="Word2Vec":
        print("word2vec model being loaded !!!")
        #model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/GoogleNews-vectors-negative300.bin', binary=True, limit=50000) 
        model =  word2vec.KeyedVectors.load_word2vec_format('./data/word_embeddings/word2vec_50k.bin', binary=True) 
        df = pd.read_csv("./data/word_embeddings_csv/word2vec.csv",header=0, keep_default_na=False)
    elif name=="Glove (wiki 300d)":
        print("Glove word embedding backend")
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.wikipedia.bin', binary=True, limit=50000)  
        df = pd.read_csv("./data/word_embeddings_csv/glove_wiki_300d.csv",keep_default_na=False)
    elif name=="Word2Vec debiased":
        print('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin')
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/GoogleNews-vectors-negative300-hard-debiased.bin', binary=True, limit=50000) 
        df = pd.read_csv("./data/word_embeddings_csv/word2vec_debiased.csv",keep_default_na=False)
    elif name=="French fastText":
        print("French fastText embedding backend")
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/french.fastText.bin', binary=True, limit=50000)
        df = pd.read_csv("./data/word_embeddings_csv/french_fastText.csv")
    elif name=="Hindi fastText":
        print("Hindi fastText embedding backend")
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/hindi.fastText.bin', binary=True, limit=50000)
        df = pd.read_csv("./data/word_embeddings_csv/hindi_fastText.csv")
    elif name=="Temp":
        model = KeyedVectors.load_word2vec_format('./data/word_embeddings/glove.debiased.gender.race.bin', binary=True, limit=50000)
        df = pd.read_csv("./data/word_embeddings_csv/glove_debiased_race_gender.csv")
    g,g1,g2 = None,None,None
    deb_high = {}

    initialwords = df['word'].tolist()
    initialwords.sort()

    # add two empty columns x and y (coordinates for plot)
    df["x"] = None
    df["y"] = None
    return "success"


@app.route('/')
def index():
    setModel()
    return render_template('index.html')


@app.route('/autocomplete/<prefix>')
def autocomplete(prefix):
    suggestions = get_close_matches(prefix, initialwords, 10, 0.1)
    # suggestions = [word for word in initialwords if word.startswith(prefix)]
    return jsonify(suggestions)


def get_bias_score(word_list):
    global g1,g2,g3,g4
    out = []
    for t in word_list:
        gen_bias = round(cosine(g2,model[t])-cosine(g1,model[t]),5)
        race_bias = round(cosine(g4,model[t])-cosine(g3,model[t]),5)
        out.append((t,gen_bias,race_bias))
    return out

@app.route('/search/<name>')
def search(name):
    num_results = 10
    count = 0
    print("name  ",name)
    if model is None:
        setModel()
    neigh = None
    try:
        w = Word(name)
        neigh = w.synonyms()
    except:
        print("Not Found in Thesaurus !!!")
    
    if neigh:
        neigh = [x for x in neigh if x in model]
    if not neigh or len(neigh)<3:
        neigh = model.similar_by_word(name, topn=50)
        neigh = [x[0] for x in neigh]  
    print(neigh)

    temp = get_bias_score([name])
    base_score = abs(temp[0][1])+abs(temp[0][2])
    res = []
    for x in neigh:
        temp = get_bias_score([x])
        if abs(temp[0][1])+abs(temp[0][2])<base_score:
            print(x[0],x[1], temp, abs(temp[0][1])+abs(temp[0][2]))
            g_bias = normalize(temp[0][1], "gender") 
            r_bias = normalize(temp[0][2], "race") 
            res.append({"word":x,"x":g_bias, "y":r_bias})
            count+=1
            if count==20:
                break
    #df_proj = df_proj.append(res, ignore_index=True)
    return jsonify(res)


def unit_vector(vec):
    return vec/norm(vec)


# calculate bias direction when we have group of words not pairs
def groupBiasDirection(gp1, gp2):
    g1,g2 = None, None
    print("Group bias direction !!!!!!!")
    dim = len(model["he"])
    g1,g2 = np.zeros((dim,), dtype=float), np.zeros((dim,), dtype=float)
    for p in gp1:
        p = p.strip()
        if p not in model:
            continue
        p_vec = model[p]/norm(model[p])
        g1 = np.add(g1,p_vec)

    for q in gp2:
        q = q.strip()
        if q not in model:
            continue
        q_vec = model[q]/norm(model[q])
        g2 = np.add(g2,q_vec) 

    g1, g2 = g1/norm(g1), g2/norm(g2)
    return (g1,g2)


@app.route('/biasDirection', methods=['GET','POST'])
def biasDirection():
    global g1,g2,g3,g4
    print("bias direction being computed")
    embedding_type = request.args.get("embedding")
    print("value of model ",model)
    if model is None:
        setModel(embedding_type)
    gp1 = json.loads(request.args.get("gp1"))
    gp2 = json.loads(request.args.get("gp2"))
    print(gp1,gp2)
    g1, g2 = groupBiasDirection(gp1,gp2)
    #g3, g4 = groupBiasDirection(["black","african"],["white","european"])
    g3, g4 = groupBiasDirection(["blacks","african","minorities"],["whites","european"])
    return "success"


# calculate Group bias for 'Group' bias identification type (National Academy of Sciences)
@app.route('/groupDirectBias/')
def groupDirectBias():
    temp = request.args.get("target")
    print("*******************")
    print(temp)
    target = None
    if not temp:
        target = df["word"].tolist()
    else:
        target = json.loads(temp)
    print("Target ",colored(target, 'green'))
    print("Group direct bias function !!!!")
    if g1 is None or g2 is None:
        print("Returning is None !!!", "green")
        return jsonify([])
    tar_bias = {}
    for t in target:
        if not t or len(t)<=1:
            continue
        if t not in model:
            tar_bias[t] = "NA"
        else:
            b = round(cosine(g1,model[t])-cosine(g2,model[t]),3)
            tar_bias[t]= b
    return jsonify(tar_bias)


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

# projection on bias axis
@app.route('/projectingAxis/')
def projectingAxis():
    global df_proj, bias_val
    thresh = request.args.get("thresh")
    bias_type = request.args.get("type")
    target = request.args.get("target").lower()
    
    ## Adding extra bias on y-axis 
    #g3, g4 = groupBiasDirection(["black","aisha","keisha","tamika","lakisha","tanisha","latoya","kenya","latonya","ebony","rasheed","tremayne","kareem","darnell","tyrone","hakim","jamal","leroy","jermaine"],
    #        ["white","emily","anne","jill","allison","laurie","sarah","meredith","carrie","kristen","todd","neil","geoffrey","brett","brendan","greg","matthew","jay","brad"])
    
    #g3, g4 = groupBiasDirection(["black","african"],["white","european"])
    #g1, g2 = groupBiasDirection(["him","he","boy"],["she","her","girl"])
    
    tar_words = re.findall(r"[\w']+", target)
    # filtering stop words
    tar_words = [word for word in tar_words if word not in stopwords.words('english') and not word.isdigit()]
    print(tar_words)
    bias_val = []

    df_proj = pd.DataFrame({'word':tar_words})
    df_proj["x"] = None
    df_proj["y"] = None
    for index, row in df_proj.iterrows():
        w = row["word"]
        if w not in model:
            print("Not present: ", w)
            continue
        x = round(cosine(g2,model[w])-cosine(g1,model[w]),5)
        #y = round(cos_sim(g,model[w]),5)    # Semantic
        #y = round(min(cosine(g1,model[w]) , cosine(g2,model[w])),5)    # Neutrality
        y = round(cosine(g4,model[w])-cosine(g3,model[w]),5)   # second bias

        x = normalize(x,"gender")
        y = normalize(y, "race")

        print(w,cosine(g1,model[w]),cosine(g2,model[w]),x,y)
        df_proj.set_value(index, 'x', x)
        df_proj.set_value(index, 'y', y)
        bias_val.append([w,x])  
    df_proj.to_csv("out.csv", index=False, encoding='utf-8')
    return jsonify(bias_val)


# populate default set of target words
@app.route('/getWords/')
def getWords():
    path = request.args.get("path")
    words = []
    f = open(path, "r")
    for x in f:
        if len(x)>0:
            x = x.strip().lower()
            words.append(x)
    return jsonify({"target":words})

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