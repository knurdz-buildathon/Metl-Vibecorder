class GeminiClient:
    def __init__(self):
        self._client = None
        self._configured = False
        self._init_client()

    def _init_client(self):
        from src.config import settings

        if settings.gemini_provider == "developer" and settings.gemini_api_key:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            self._client = genai
            self._configured = True
        elif settings.gemini_provider == "vertex":
            try:
                import vertexai
                vertexai.init(
                    project=settings.google_cloud_project,
                    location=settings.google_cloud_location,
                )
                self._client = vertexai
                self._configured = True
            except Exception:
                self._configured = False
        else:
            self._configured = False

    def is_configured(self) -> bool:
        return self._configured

    def is_healthy(self) -> bool:
        """Test Gemini connectivity by listing available models."""
        if not self._configured:
            return False
        try:
            from src.config import settings
            if settings.gemini_provider == "developer":
                # Test with a minimal models.list() call
                import google.generativeai as genai
                models = genai.list_models()
                # Just verify we got a response
                next(models, None)
                return True
            elif settings.gemini_provider == "vertex":
                import vertexai
                from vertexai.generative_models import GenerativeModel
                # Try to initialize the configured model
                model = GenerativeModel(settings.gemini_model)
                return True
            return False
        except Exception as e:
            print(f"Gemini health check failed: {e}")
            return False

    async def generate(self, prompt: str, model: str = None) -> str:
        if not self._configured:
            raise RuntimeError("Gemini client is not configured")
        # TODO: implement generation with proper model selection
        return "TODO: Gemini generation"


gemini_client = GeminiClient()
