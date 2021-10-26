# Fluent: An AI Augmented Writing Tool for People who Stutter

Paper accepted at ACM SIGACCESS Conference on Computers and Accessibility, ACM ASSETS, 2021

- #### Read paper [PDF](https://dl.acm.org/doi/10.1145/3441852.3471211)

- #### Paper Presentation [Video](https://www.youtube.com/watch?v=H-I21hn5-gM&ab_channel=ACMSIGACCESS)

- #### Live DEMO http://130.245.128.219:3999/


![teaser figure](teaser.png)

The above picture shows the visual Interface of Fluent. Words highlighted in blue are the ones which the user might find difficult to pronounce. Hovering over such words presents a set of alternatives (including Ignore option) which have similar meaning but might be easier to pronounce. In the above picture, the user hovers over the word 'country' and the tool presents a set of alternatives namely, nation, state, commonwealth, area, etc. Two buttons on the top right corner allows the user to provide explicit feedback and update their preferences respectively.

## DEMO Video

https://user-images.githubusercontent.com/4745227/131208591-13c46c37-c69d-4241-ad28-c747ae63e387.mp4


## Overview

Stuttering is a speech disorder which impacts the personal and professional lives of millions of people worldwide. To save themselves from the stigma and embarrassment, people who stutter (PWS) may adopt different strategies to conceal their stuttering. One of the common strategies is word substitution where an individual avoids saying a word they might stutter on and use an alternative instead. Research has shown that this process itself can cause stress and add more burden. In this work, we present Fluent, an AI augmented writing tool which assists a PWS in writing scripts which they speak fluently. Fluent embodies a novel Active learning based method of identifying words an individual might struggle pronouncing. Such words are highlighted in the interface. On hovering over any such word, Fluent presents a set of alternative words which have similar meaning but are easier to speak. The user is free to accept or ignore these suggestions. Based on such user actions (feedback), Fluent continuously evolves its classifier to better suit the personalized needs of each user. Using a simulation study, we demonstrate the effectiveness of our tool to learn user's unique needs. Such a tool can be beneficial for certain important life situations like giving a talk, presentation, etc.

## Installation Instructions

- Clone this repo

- Install Dependencies using: pip install -r req.txt

- python -m spacy download en_core_web_sm

- Run python app.py

- Browse localhost:3999

## Citation

```
@inproceedings{ghai2021fluent,
  title={Fluent: An AI Augmented Writing Tool for People who Stutter},
  author={Ghai, Bhavya and Mueller, Klaus},
  booktitle={The 23rd International ACM SIGACCESS Conference on Computers and Accessibility},
  pages={1--8},
  year={2021}
}
```

Feel free to email me for any questions, comments at bghai@cs.stonybrook.edu
