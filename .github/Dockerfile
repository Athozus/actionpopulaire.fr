FROM ubuntu:24.04

ENV TZ=Etc/UTC
ENV PYTHON_KEYRING_BACKEND="keyring.backends.null.Keyring"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update
RUN apt-get upgrade -y

RUN apt-get install python3.12 python3.12-dev python3.12-venv pipx -y
RUN apt-get install python3-pip build-essential git language-pack-fr libgdal-dev jq libsystemd-dev -y
RUN apt-get install librsvg2-bin -y
RUN ln -sfn /usr/bin/python3.12 /usr/bin/python3
RUN pipx install poetry
RUN pipx ensurepath
ENV PATH="$PATH:/root/.local/share/pipx/venvs/poetry/bin"
