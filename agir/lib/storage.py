from django.core.files.storage import get_storage_class


class OverwriteStorage(get_storage_class()):
    def _save(self, name, content):
        self.delete(name)
        return super(OverwriteStorage, self)._save(name, content)

    def get_available_name(self, name, max_length=None):
        return name


class PrivateMediaStorage(get_storage_class()):
    default_acl = "private"

    def get_object_parameters(self, name):
        params = super().get_object_parameters(name)
        params["ACL"] = "private"
        return params
