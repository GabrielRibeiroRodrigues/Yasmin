# Create your models here.
from django.db import models 

class UF(models.Model):
        sigla = models.CharField(max_length=2, verbose_name="UF")
        def __str__(self):
            return self.sigla


class Cidade(models.Model):
        nome = models.CharField(max_length=100, verbose_name="Nome da cidade")
        uf = models.ForeignKey(UF, on_delete=models.CASCADE, verbose_name="sigla")
        def __str__(self):
            return f"{self.nome}, {self.uf}"
        class Meta:
            verbose_name = "Cidade"
            verbose_name_plural = "Cidades"
# class Usuario(models.Model):
#     nome = models.CharField(max_length=100, verbose_name="Nome")
#     cpf = models.CharField(max_length=100, verbose_name="cpf")
#     data_nasc = models.DateField()
#     email = models.CharField(max_length=100, verbose_name="email")
#     telefone = models.IntegerField()
#     cidade = models.ForeignKey(Cidade, on_delete=models.CASCADE,
# verbose_name="Cidade do autor")
#     def __str__(self):
#         return self.nome
#     class Meta:
#         verbose_name = "Usuario"
#         verbose_name_plural = "Usuarios"


# class Autor(models.Model):
#     nome = models.CharField(max_length=100, verbose_name="Nome do autor")
#     cidade = models.ForeignKey(Cidade, on_delete=models.CASCADE,
# verbose_name="Cidade do autor")
#     def __str__(self):
#         return self.nome
#     class Meta:
#         verbose_name = "Autor"
#         verbose_name_plural = "Autores"
# class Editora(models.Model):
#     nome = models.CharField(max_length=100, verbose_name="Nome da editora")
#     site = models.CharField(max_length=100, verbose_name="Site da editora")
#     cidade = models.ForeignKey(Cidade, on_delete=models.CASCADE,
# verbose_name="Cidade da editora")
#     def __str__(self):
#         return self.nome
#     class Meta:
#         verbose_name = "Editora"
#         verbose_name_plural = "Editoras"

class Leitor(models.Model):
        nome = models.CharField(max_length=100, verbose_name="Nome do leitor")
        email = models.CharField(max_length=100, verbose_name="Email do leitor")
        cpf = models.CharField(max_length=100, unique=True,verbose_name="CPF do leitor")
        def __str__(self):
            return self.nome
        class Meta:
            verbose_name = "Leitor"
            verbose_name_plural = "Leitores"

class Genero(models.Model):
        nome = models.CharField(max_length=100, verbose_name="Gênero")
        def __str__(self):
            return self.nome
        class Meta:
            verbose_name = "Gênero"
            verbose_name_plural = "Gêneros"
class Livro(models.Model):
        nome = models.CharField(max_length=100, verbose_name="Nome do livro")
        autor = models.ForeignKey('Autor', on_delete=models.CASCADE, verbose_name="Autor do livro")
        editora = models.ForeignKey('Editora', on_delete=models.CASCADE,verbose_name="Editora do livro")
        genero = models.ForeignKey('Genero', on_delete=models.CASCADE,verbose_name="Gênero do livro")
        preco = models.IntegerField(verbose_name="Preço do livro")
        data_plub = models.DateField(verbose_name="Data de publicação do livro")
        status = models.BooleanField(verbose_name="Status do livro")
        def __str__(self):
            return f'{self.nome}, {self.autor}'
        class Meta:
            verbose_name = "Livro"
            verbose_name_plural = "Livros"

class Emprestimo(models.Model):
        dataemprestimo=models.DateField()
        usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE,verbose_name="Usuario")
        livro = models.ForeignKey('Livro', on_delete=models.CASCADE,verbose_name="Livro")
        datadevolucao=models.DateField()

        def __str__(self):
            return self.usuario.nome

        # Superclasse de 'pessoa' que sera uma classe pai para: pessoafísica e pessoajurídica

class Pessoa(models.Model):
        nome= models.CharField(max_length=255, default='')
        email= models.CharField(max_length=255, default='')
        telefone = models.CharField(max_length=255, default='')
        cidade= models.ForeignKey('Cidade', on_delete=models.CASCADE, default=1)

        class Meta:
            abstract = True

        def __str__(self):
            return self.nome

class pessoaFisica(Pessoa):
        cpf = models.CharField(max_length=255, default='')
        data_nasc = models.DateField(default='2000-01-01')

        class Meta:
            abstract=True

class pessoaJurídica(Pessoa):
        cnpj = models.IntegerField(default=0)
        razao_social = models.CharField(max_length=255, default='')
        data_fundacao = models.DateField(default='2000-01-01')

        class Meta:
            abstract=True

class Autor(pessoaFisica):
        pass

        class Meta:
            verbose_name='Autor'
            verbose_name_plural='Autores'

class Editora(pessoaJurídica):
        site=models.CharField(max_length=255)

        class Meta:
            verbose_name='Editora'
            verbose_name_plural='Editoras'

class Usuario(pessoaFisica):
        pass

        class Meta:
            verbose_name='Usuario'
            verbose_name_plural='Usuarios' 


       