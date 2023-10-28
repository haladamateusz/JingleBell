SHELL := /bin/bash
CONDA := /home/paul/anaconda3/bin/conda

run_server:
	source $$(/home/paul/miniconda/bin/conda info --base)/etc/profile.d/conda.sh ; \
	conda activate appenv ; \
	python backend/manage.py makemigrations ; \
	python backend/manage.py migrate ; \
	python backend/manage.py runserver
