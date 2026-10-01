from ml.translation_service.model import EN_INDIC_MODEL, Translator


def test_translate_returns_target_language_text(monkeypatch):
    translator = Translator()
    model = _FakeModel()
    monkeypatch.setattr(
        translator,
        "_get_model",
        lambda _model_id: (model, _FakeTokenizer(), _FakeProcessor(), _FakeTorch()),
    )

    result = translator.translate("नमस्ते", "hi-IN", "ta")

    assert result == "வணக்கம்"
    assert model.generate_kwargs["num_beams"] == 5


def test_english_to_indic_selects_the_en_indic_model(monkeypatch):
    translator = Translator()
    selected_models = []
    monkeypatch.setattr(
        translator,
        "_get_model",
        lambda model_id: (selected_models.append(model_id) or (_FakeModel(), _FakeTokenizer(), _FakeProcessor(), _FakeTorch())),
    )

    translator.translate("Hello", "en", "hi")

    assert selected_models == [EN_INDIC_MODEL]


class _FakeInput(dict):
    def to(self, _):
        return self


class _FakeTokenizer:
    def __call__(self, *_args, **_kwargs):
        return _FakeInput()

    def batch_decode(self, *_args, **_kwargs):
        return ["mock-output"]


class _FakeProcessor:
    def preprocess_batch(self, sentences, **_kwargs):
        return sentences

    def postprocess_batch(self, _sentences, **_kwargs):
        return ["வணக்கம்"]


class _FakeModel:
    def __init__(self):
        self.generate_kwargs = None

    def parameters(self):
        return iter([type("Parameter", (), {"device": "cpu"})()])

    def generate(self, **kwargs):
        self.generate_kwargs = kwargs
        return [1, 2, 3]


class _FakeTorch:
    class inference_mode:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False
