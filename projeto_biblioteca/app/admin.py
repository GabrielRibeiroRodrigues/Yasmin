from django.contrib import admin
from .models import *

admin.site.register(Leitor)
admin.site.register(Usuario)

class CidadeInline(admin.TabularInline):
    model = Cidade
    extra = 1

class UFAdmin(admin.ModelAdmin):
    inlines = [CidadeInline]

admin.site.register(UF, UFAdmin)
admin.site.register(Cidade)

class LivroInline(admin.TabularInline):
    model = Livro
    extra = 1 # Número de livros adicionais para adicionar no admin

class EmprestimoInline(admin.TabularInline):
    model = Emprestimo
    extra = 1 # Número de livros adicionais para adicionar no admin

class AutorAdmin(admin.ModelAdmin):
    list_display = ('nome',)# Campos que serão exibidos na listagem
    search_fields = ('nome',)# Campos que serão pesquisados
    inlines = [LivroInline]# Adiciona a tabela de livros no admin de gêneros


admin.site.register(Autor,AutorAdmin)


class EditoraAdmin(admin.ModelAdmin):
    list_display = ('nome',)# Campos que serão exibidos na listagem
    search_fields = ('nome',)# Campos que serão pesquisados
    inlines = [LivroInline]# Adiciona a tabela de livros no admin de gêneros

class GeneroAdmin(admin.ModelAdmin):
    list_display = ('nome',)# Campos que serão exibidos na listagem
    search_fields = ('nome',)# Campos que serão pesquisados
    inlines = [LivroInline]# Adiciona a tabela de livros no admin de gêneros

admin.site.register(Genero, GeneroAdmin)
admin.site.register(Editora, EditoraAdmin)

class LivroAdmin(admin.ModelAdmin):
    list_display = ('nome',)# Campos que serão exibidos na listagem
    search_fields = ('nome',)# Campos que serão pesquisados
    inlines = [EmprestimoInline]# Adiciona a tabela de livros no admin de gêneros

admin.site.register(Livro,LivroAdmin)
admin.site.register(Emprestimo)


