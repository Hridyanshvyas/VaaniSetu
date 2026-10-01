import pytest
from pathlib import Path

from ml.stt_service.model import SUPPORTED_LANGUAGES, SpeechToText, TranscriptionResult


def test_transcribe_returns_standalone_contract(monkeypatch):
    stt = SpeechToText()
    monkeypatch.setattr(stt, "_decode_audio", lambda _: [0.1, 0.2])
    monkeypatch.setattr(
        stt,
        "_get_model",
        lambda _: (_FakeProcessor(), _FakeModel(), _FakeTorch()),
    )

    result = stt.transcribe(b"sample-audio", "hi-IN")

    assert result == TranscriptionResult("नमस्ते", "hi", 0.9)


@pytest.mark.parametrize(
    ("hint", "language", "model_id"),
    [
        ("ta-IN", "ta", "ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large"),
        ("te", "te", "ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large"),
        ("en-IN", "en", "facebook/wav2vec2-base-960h"),
    ],
)
def test_supported_pipeline_languages_select_their_stt_checkpoint(hint, language, model_id):
    stt = SpeechToText()

    assert stt._normalise_language(hint) == language
    assert SUPPORTED_LANGUAGES[language] == model_id


@pytest.mark.parametrize(("language", "expected_text"), [("ta", "வணக்கம்"), ("te", "నమస్కారం")])
def test_indic_conformer_transcribes_normalized_wav_and_cleans_up_temp_file(monkeypatch, tmp_path, language, expected_text):
    class FakeConformer:
        cur_decoder = None

        def transcribe(self, paths, **kwargs):
            assert self.cur_decoder == "ctc"
            assert kwargs == {
                "batch_size": 1,
                "num_workers": 0,
                "verbose": False,
                "logprobs": False,
                "language_id": language,
            }
            assert len(paths) == 1
            assert Path(paths[0]).exists()
            # Hybrid IndicConformer returns CTC and RNNT result collections.
            return ([expected_text], [expected_text])

    import ml.stt_service.model as stt_module

    path = tmp_path / "normalised.wav"
    monkeypatch.setattr(stt_module.tempfile, "NamedTemporaryFile", lambda **_: _TemporaryFile(path))
    text = SpeechToText._conformer_transcription(FakeConformer(), [0.1, 0.2], language)

    assert text == expected_text
    assert not path.exists()


class _TemporaryFile:
    def __init__(self, path):
        self.name = str(path)

    def __enter__(self):
        Path(self.name).touch()
        return self

    def __exit__(self, *_):
        return False


class _FakeProcessor:
    def __call__(self, audio, **_):
        return type("Inputs", (), {"input_values": _InputValues()})()

    def batch_decode(self, _):
        return ["नमस्ते"]


class _InputValues:
    def to(self, _):
        return self


class _FakeModel:
    def parameters(self):
        return iter([type("Parameter", (), {"device": "cpu"})()])

    def __call__(self, _):
        return type("Output", (), {"logits": _Logits()})()


class _Logits:
    def __getitem__(self, _):
        return self


class _Values:
    def item(self):
        return 0.9


class _Max:
    values = _Values()


class _Probabilities:
    def unsqueeze(self, _):
        return self


class _FakeTorch:
    class inference_mode:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    @staticmethod
    def softmax(_, dim):
        assert dim == -1
        return _Probabilities()

    @staticmethod
    def argmax(_, dim):
        assert dim == -1
        return _Probabilities()

    @staticmethod
    def max(_, dim):
        assert dim == -1
        return _Max()

    @staticmethod
    def mean(_):
        return _Values()
