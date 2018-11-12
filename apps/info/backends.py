from rest_framework_datatables.filters import DatatablesFilterBackend


class BoardDatatablesFilterBackend(DatatablesFilterBackend):

    EXCLUDE_FIELDS = ('waiting_hours',)

    def get_fields(self, getter):
        fields = super().get_fields(getter)
        for field in fields:
            if field['data'] in self.EXCLUDE_FIELDS:
                fields.remove(field)
        return fields


class BoardDatatablesByCreatedDateFilterBackend(BoardDatatablesFilterBackend):

    def get_ordering(self, getter, fields):
        return ['created_at']
