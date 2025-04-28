import os
import unittest

import pandas as pd

from numpy.ma.testutils import assert_equal

from agir.api import settings
from agir.api.black_list_utils import field_allowed


def mock_black_list():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    current_csv = f"{dir_path}/black_list_words.csv"
    black_list_data_frame = pd.read_csv(current_csv)

    return black_list_data_frame


class MailLinkTestCase(unittest.TestCase):

    def setUp(self):
        settings.BLACK_LIST_DF = mock_black_list()

    def test_word_not_black_listed_allowed(self):
        assert_equal(field_allowed("person", "first_name", "chat"), True)

    def test_simple_word_not_allowed(self):
        assert_equal(field_allowed("person", "first_name", "canard"), False)

    def test_word_not_allowed(self):
        assert_equal(field_allowed("person", "first_name", "marabout"), False)

    def test_word_partial_word_allowed(self):
        assert_equal(field_allowed("person", "first_name", "canardo"), True)

    def test_word_partial_in_sentence_allowed(self):
        assert_equal(field_allowed("person", "first_name", "ciao canardo !"), True)
