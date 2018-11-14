from django.utils.translation import ugettext_lazy as _

from apps.core import GenericModel, nullable
from .fields import BalanceJSONField


class SystemBalanceReport(GenericModel):
    balances = BalanceJSONField(verbose_name=_('Balances'), **nullable)
    mt_accounts = BalanceJSONField(verbose_name=_('mt accounts'), **nullable)
    clients = BalanceJSONField(verbose_name=_('clients'), **nullable)
    sale_managers = BalanceJSONField(verbose_name=_('sale managers'), **nullable)
    deposits = BalanceJSONField(verbose_name=_('deposits'), **nullable)
    withdrawals = BalanceJSONField(verbose_name=_('withdrawals'), **nullable)

    @classmethod
    def create_report(cls):
        data = cls.calculate()
        report = cls.objects.create(**data)
        return report

    @classmethod
    def get_json_fields(cls):
        return [field for field in cls._meta.fields
                if isinstance(field, BalanceJSONField)]

    def to_json(self):
        fields = self.__class__.get_json_fields()
        return {field.name: getattr(self, field.name) for field in fields}

    def prepare_json_fields(self):
        fields = self.__class__.get_json_fields()
        for field in fields:
            val = getattr(self, field.name)
            setattr(self, field.name, field.to_json(val))
