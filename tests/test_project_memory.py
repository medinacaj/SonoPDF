import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "refresh_project_memory.py"
spec = importlib.util.spec_from_file_location("project_memory", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SnapshotTests(unittest.TestCase):
    def test_ci_not_deployment(self):
        result = module.render("owner/repo", {"default_branch": "main"}, {"commit": {"sha": "abc"}}, [], [], {"workflow_runs": []}, "2026-11-19 UTC")
        self.assertIn("CI ≠ despliegue", result)
        self.assertIn("despliegue no verificado", result)
    def test_pr_sha(self):
        pr = {"number": 5, "html_url": "https://github.com/o/r/pull/5", "draft": True, "head": {"sha": "abcdef"}}
        result = module.render("owner/repo", {"default_branch": "main"}, {"commit": {"sha": "abc"}}, [pr], [], {"workflow_runs": []}, "2026-11-19 UTC")
        self.assertIn("abcdef", result)

if __name__ == "__main__":
    unittest.main()
