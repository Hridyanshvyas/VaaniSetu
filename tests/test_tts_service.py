import pytest

from ml.tts_service.model import TextToSpeech


def test_synthesize_returns_wav_bytes_for_hindi(monkeypatch):
    tts = TextToSpeech()
    fake_model = _FakeModel()
    monkeypatch.setattr(
        tts,
        "_get_model",
        lambda: (fake_model, _FakeTokenizer(), _FakeTokenizer(), _FakeTorch()),
    )
    monkeypatch.setattr(tts, "_wav_bytes", lambda audio, rate: b"RIFFfakeWAVE")

    audio = tts.synthesize("नमस्ते, आप कैसे हैं?", "hi-IN")

    assert audio.startswith(b"RIFF")
    assert fake_model.generate_kwargs["prompt_input_ids"].value == "नमस्ते, आप कैसे हैं?"


@pytest.mark.parametrize(
    ("tag", "normalised", "language_name"),
    [("ta-IN", "ta", "Tamil"), ("te", "te", "Telugu"), ("en-IN", "en", "English")],
)
def test_tts_accepts_each_new_pipeline_language(tag, normalised, language_name):
    assert TextToSpeech._normalise_language(tag) == normalised
    assert language_name in TextToSpeech._description_for(normalised)


class _FakeTensor:
    ndim = 1
    size = 1

    def detach(self):
        return self

    def to(self, *_args, **_kwargs):
        return self

    def float(self):
        return self

    def numpy(self):
        return self

    def squeeze(self):
        return self


class _FakeInput:
    def __init__(self, value):
        self.value = value

    def to(self, _):
        return self


class _FakeTokenizer:
    def __call__(self, value, **_):
        return type("Inputs", (), {"input_ids": _FakeInput(value), "attention_mask": _FakeInput(value)})()


class _FakeModel:
    config = type("Config", (), {"sampling_rate": 24_000})()

    def __init__(self):
        self.generate_kwargs = None

    def parameters(self):
        return iter([type("Parameter", (), {"device": "cpu"})()])

    def generate(self, **kwargs):
        self.generate_kwargs = kwargs
        return _FakeTensor()


class _FakeTorch:
    class inference_mode:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False
