$(() => {

  obtenerTodosParqueaderos();

  $('#parqueaderos').on('click', '#btnEntrada', function (evt) {

    $('#nombreClienteEntrada').val('')
    $('#placaCarroEntrada').val('')
    $('#celularClienteEntrada').val('')
    $('#observacionEntrada').val('')
    $('#btnUploadFile').val('')
    $('.determinate').attr('style', `width: 0%`)

    sessionStorage.setItem('imgNewEntrada', null)
    sessionStorage.setItem('idParqueadero', $(this).data('id'))

    const user = firebase.auth().currentUser

    if (user == null) {
      Materialize.toast(`Para crear la entrada debes estar autenticado`, 4000)
      return
    }

    $('#modalEntrada').modal('open')
  })

  $('#parqueaderos').on('click', '#btnSalida', async function (evt) {
    const user = firebase.auth().currentUser

    if (user == null) {
      Materialize.toast(`Para crear la entrada debes estar autenticado`, 4000)
      return
    }

    const idEntrada = $(this).data('identrada');
    console.log(idEntrada);

    const calcularCostoParqueo =
      firebase.functions().httpsCallable('calcularCostoParqueadero');

    const resp = await calcularCostoParqueo({
      idEntrada: idEntrada
    });

    const costo = resp.data.costo;
    console.log(`Costo => ${costo}`)

    sessionStorage.setItem('costo', costo);
    sessionStorage.setItem('idEntrada', $(this).data('identrada'));
    sessionStorage.setItem('idParqueadero', $(this).data('id'));

    const fechaActual = Utilidad.obtenerFechaHoraActual();

    $('#lblHoraSalida').html(`Hora Salida: ${fechaActual}`);
    $('#lblCosto').html(`Costo: $ ${costo} pesos`);

    $('#modalSalida').modal('open');
  })

  $('#btnTodoParqueaderos').click(async () => {
    $('#tituloParqueadero').text('Todos los Parqueaderos');
    const parqueaderoObj = new Parqueadero();
    await parqueaderoObj.consultarTodosParquedaderosUnaVez(mostrarParqueadero);
  })

  $('#btnParqueaderoLibre').click(async () => {
    $('#tituloParqueadero').text('Parqueaderos Libres');
    const parqueaderoObj = new Parqueadero();
    $('#parqueaderos').empty();
    const lst = await parqueaderoObj.consultarParqueaderoLibres();
    lst.forEach(parqueadero => {      
      mostrarParqueadero(parqueadero);
    })
  })

  async function obtenerTodosParqueaderos() {
    $('#tituloParqueadero').text('Todos los Parqueaderos');
    const parqueaderoObj = new Parqueadero();
    $('#parqueaderos').empty();
    await parqueaderoObj.consultarTodosParquedaderos(mostrarParqueadero);
  }

  function mostrarParqueadero(parqueadero) {
    let parqueaderoHtml = "";
    if (parqueadero.libre) {
      parqueaderoHtml = Utilidad.obtenerTemplateParqueaderoVacio(
        parqueadero.nombreParqueadero,
        parqueadero.id
      )
    } else {
      parqueaderoHtml = Utilidad.obtenerParqueaderoTemplate(
        parqueadero.nombreParqueadero,
        parqueadero.nombreCliente,
        parqueadero.celularCliente,
        parqueadero.placa,
        parqueadero.observacion,
        parqueadero.imagenLink,
        Utilidad.obtenerFecha(parqueadero.fecha.toDate()),
        parqueadero.id,
        parqueadero.idEntrada
      )
    }
    $('#parqueaderos').append(parqueaderoHtml);

  }

  $('#btnParqueaderosLibres').click(async () => {
    $('#tituloParqueadero').text('Parqueaderos Libres');
    const user = firebase.auth().currentUser;
    if (user) {
      const parqueaderoObj = new Parqueadero();
      const parquederosLibres = await parqueaderoObj.consultarParqueaderoLibres()
      //mostrarParqueaderos(parquederosLibres);
    } else {
      Materialize.toast(`Debes estar autenticado para ver los parqueaderos libres`, 4000)
    }
  })

  $('#btnRegistroEntrada').click(async () => {
    const parqueaderoObj = new Parqueadero();
    const user = firebase.auth().currentUser;

    const nombreCliente = $('#nombreClienteEntrada').val();
    const placaCarro = $('#placaCarroEntrada').val();
    const celularCliente = $('#celularClienteEntrada').val();
    const observacion = $('#observacionEntrada').val();
    const idParqueadero = sessionStorage.getItem('idParqueadero');

    const imagenLink = sessionStorage.getItem('imgNewEntrada') == 'null'
      ? null
      : sessionStorage.getItem('imgNewEntrada')

    try {
      await parqueaderoObj
        .crearEntrada(
          user.uid,
          idParqueadero,
          nombreCliente,
          placaCarro,
          celularCliente,
          observacion,
          imagenLink
        )

      Materialize.toast(`Entrada de vehículo creada correctamente`, 4000)
      $('.modal').modal('close')

    } catch (error) {
      console.error(`Error creando la entrada => ${error}`)
    }
  })

  $('#btnRegistroSalida').click(async () => {
    const parqueaderoObj = new Parqueadero();

    const fechaSalida = firebase.firestore.FieldValue.serverTimestamp();
    const costo = sessionStorage.getItem('costo');
    const idEntrada = sessionStorage.getItem('idEntrada');
    const idParqueadero = sessionStorage.getItem('idParqueadero');

    $('#parqueaderos').empty();

    const trace = firebase.performance().trace('RegistroSalida');
    trace.start();

    try {
      await parqueaderoObj
        .crearSalida(
          idEntrada,
          fechaSalida,
          costo,
          idParqueadero
        );

      trace.stop();

      Materialize.toast(`Salida de vehículo creada correctamente`, 4000)
      $('.modal').modal('close')

    } catch (error) {
      console.error(`Error creando la salida => ${error}`)
    }
  })

  $('#btnUploadFile').on('change', e => {
    const file = e.target.files[0]
    const user = firebase.auth().currentUser;
    const parqueaderoObj = new Parqueadero();
    parqueaderoObj.subirImagenPost(file, user.uid)
  })
})
