import logging
import os

if not os.path.exists("access.log"):
    with open("access.log", "a") as f:
        pass

LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler("access.log", mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("access_logger")