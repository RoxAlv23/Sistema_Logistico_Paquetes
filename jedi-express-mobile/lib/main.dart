import 'package:geolocator/geolocator.dart';

import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

Timer? temporizadorGPS;
bool seguimientoActivo = false;

void main() {
  runApp(const JediExpressApp());
}

const azul = Color(0xFF173B67);
const fondo = Color(0xFFF4F7FB);

class JediExpressApp extends StatelessWidget {
  const JediExpressApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JEDi Express',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: azul),
        scaffoldBackgroundColor: fondo,
      ),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final correoController = TextEditingController();
  final claveController = TextEditingController();

  @override
  void dispose() {
    correoController.dispose();
    claveController.dispose();
    super.dispose();
  }

  void ingresar() {
    if (correoController.text.trim().isEmpty || claveController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ingresa tu correo y contraseña de prueba.'),
        ),
      );
      return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeRepartidor()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.local_shipping_rounded,
                    size: 76,
                    color: azul,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'JEDi Express',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: azul,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Gestión de entregas',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 36),
                  const Text(
                    'Iniciar sesión',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text('Ingresa a tu cuenta de repartidor.'),
                  const SizedBox(height: 24),
                  TextField(
                    controller: correoController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Correo electrónico',
                      prefixIcon: Icon(Icons.email_outlined),
                      border: OutlineInputBorder(),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: claveController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Contraseña',
                      prefixIcon: Icon(Icons.lock_outline),
                      border: OutlineInputBorder(),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onSubmitted: (_) => ingresar(),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 52,
                    child: FilledButton(
                      onPressed: ingresar,
                      style: FilledButton.styleFrom(
                        backgroundColor: azul,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Ingresar',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'JEDi Express · Aplicación para repartidores',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomeRepartidor extends StatefulWidget {
  const HomeRepartidor({super.key});

  @override
  State<HomeRepartidor> createState() => _HomeRepartidorState();
}

class _HomeRepartidorState extends State<HomeRepartidor> {
  final Map<String, String> estadosPaquetes = {
    'JED-2026-001': 'En camino',
    'JED-2026-002': 'Pendiente',
    'JED-2026-003': 'Pendiente',
  };

  Position? ubicacionActual;
  String? errorUbicacion;
  bool cargandoUbicacion = false;

  Future<void> cargarUbicacion() async {
    setState(() {
      cargandoUbicacion = true;
      errorUbicacion = null;
    });

    try {
      final posicion = await obtenerUbicacion();

      if (!mounted) return;

      setState(() {
        ubicacionActual = posicion;
        cargandoUbicacion = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        errorUbicacion = e.toString().replaceFirst('Exception: ', '');
        cargandoUbicacion = false;
      });
    }
  }

  Widget paquete(
    BuildContext context,
    String guia,
    String cliente,
    String direccion,
    String estado,
    Color color,
  ) {
    final estadoActual = estadosPaquetes[guia] ?? estado;

    final colorActual = estadoActual == 'Entregado'
        ? Colors.green
        : estadoActual == 'En camino'
        ? Colors.blue
        : Colors.orange;

    return Card(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(14),
        leading: const CircleAvatar(
          backgroundColor: Color(0xFFE8EEF7),
          child: Icon(Icons.local_shipping_outlined, color: azul),
        ),
        title: Text(guia, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('$cliente\n$direccion'),
        ),
        isThreeLine: true,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
          decoration: BoxDecoration(
            color: colorActual.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            estadoActual,
            style: TextStyle(
              color: colorActual,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DetallePaquete(
                guia: guia,
                cliente: cliente,
                direccion: direccion,
                estado: estadoActual,
                onEstadoCambiado: (nuevoEstado) {
                  setState(() {
                    estadosPaquetes[guia] = nuevoEstado;
                  });
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Future<Position> obtenerUbicacion() async {
    bool servicioActivo = await Geolocator.isLocationServiceEnabled();

    if (!servicioActivo) {
      throw Exception('Activa el GPS del dispositivo.');
    }

    LocationPermission permiso = await Geolocator.checkPermission();

    if (permiso == LocationPermission.denied) {
      permiso = await Geolocator.requestPermission();
    }

    if (permiso == LocationPermission.denied) {
      throw Exception('Se necesita permiso de ubicación.');
    }

    if (permiso == LocationPermission.deniedForever) {
      throw Exception('Activa el permiso de ubicación desde los ajustes.');
    }

    return await Geolocator.getCurrentPosition();
  }

  void iniciarSeguimientoGPS() {
    if (seguimientoActivo) return;

    seguimientoActivo = true;

    temporizadorGPS = Timer.periodic(const Duration(seconds: 15), (
      timer,
    ) async {
      if (!mounted) {
        timer.cancel();
        return;
      }

      try {
        final posicion = await Geolocator.getCurrentPosition();

        if (!mounted) return;

        setState(() {
          ubicacionActual = posicion;
          errorUbicacion = null;
        });
      } catch (e) {
        if (!mounted) return;

        setState(() {
          errorUbicacion = 'No se pudo actualizar la ubicación.';
        });
      }
    });

    cargarUbicacion();
  }

  void detenerSeguimientoGPS() {
    temporizadorGPS?.cancel();
    temporizadorGPS = null;

    setState(() {
      seguimientoActivo = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final asignados = estadosPaquetes.length;

    final pendientes = estadosPaquetes.values
        .where((estado) => estado == 'Pendiente')
        .length;

    final enCamino = estadosPaquetes.values
        .where((estado) => estado == 'En camino')
        .length;

    final entregados = estadosPaquetes.values
        .where((estado) => estado == 'Entregado')
        .length;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: azul,
        foregroundColor: Colors.white,
        title: const Text(
          'JEDi Express',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Perfil del repartidor',
            icon: const CircleAvatar(
              radius: 17,
              backgroundColor: Colors.white,
              child: Icon(Icons.person, color: azul, size: 22),
            ),
            onSelected: (opcion) {
              if (opcion == 'perfil') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PerfilRepartidor()),
                );
              } else if (opcion == 'cerrar') {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem<String>(
                value: 'perfil',
                child: Row(
                  children: [
                    Icon(Icons.person_outline),
                    SizedBox(width: 10),
                    Text('Mi perfil'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'cerrar',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red),
                    SizedBox(width: 10),
                    Text('Cerrar sesión'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),

      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            '¡Hola, Roxana!',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: azul,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Aquí tienes el resumen de tu jornada.',
            style: TextStyle(color: Color(0xFF64748B)),
          ),

          const SizedBox(height: 24),

          // UBICACIÓN GPS
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.location_on, color: azul, size: 26),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Mi ubicación GPS',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: azul,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  cargandoUbicacion
                      ? 'Obteniendo ubicación...'
                      : ubicacionActual != null
                      ? 'Latitud: ${ubicacionActual!.latitude}\n'
                            'Longitud: ${ubicacionActual!.longitude}\n'
                            '${seguimientoActivo ? "Seguimiento GPS activo" : "Seguimiento GPS detenido"}'
                      : errorUbicacion ?? 'Consulta tu ubicación actual.',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF475569),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: cargandoUbicacion
                        ? null
                        : () {
                            if (seguimientoActivo) {
                              detenerSeguimientoGPS();
                            } else {
                              iniciarSeguimientoGPS();
                            }
                            setState(() {});
                          },
                    icon: Icon(
                      seguimientoActivo ? Icons.location_on : Icons.my_location,
                    ),
                    label: Text(
                      cargandoUbicacion
                          ? 'Buscando ubicación...'
                          : seguimientoActivo
                          ? 'Detener seguimiento GPS'
                          : 'Iniciar seguimiento GPS',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: azul,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // RESUMEN DE ENTREGAS
          Row(
            children: [
              Expanded(
                child: resumen(
                  'Asignados',
                  '$asignados',
                  Icons.inventory_2_outlined,
                  azul,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: resumen(
                  'Pendientes',
                  '$pendientes',
                  Icons.pending_actions,
                  Colors.orange.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: resumen(
                  'En camino',
                  '$enCamino',
                  Icons.local_shipping_outlined,
                  Colors.blue.shade700,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: resumen(
                  'Entregados',
                  '$entregados',
                  Icons.check_circle_outline,
                  Colors.green.shade700,
                ),
              ),
            ],
          ),

          const SizedBox(height: 28),

          // RUTA DEL DÍA
          const Text(
            'Ruta de hoy',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Consulta las entregas asignadas para tu jornada.',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.route, color: azul, size: 28),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Recorrido de entregas',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '$asignados entregas de prueba · '
                  '$pendientes pendientes · '
                  '$entregados completadas',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MapaRepartidor(
                            latitud: ubicacionActual?.latitude,
                            longitud: ubicacionActual?.longitude,
                          ),
                        ),
                      );
                    },

                    icon: const Icon(Icons.map_outlined),
                    label: const Text('Ver ruta en el mapa'),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // LISTA DE ENTREGAS
          const Text(
            'Entregas asignadas',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Selecciona un paquete para consultar sus detalles.',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
          ),
          const SizedBox(height: 12),

          paquete(
            context,
            'JED-2026-001',
            'Carlos Martínez',
            'Colonia Escalón',
            'En camino',
            Colors.blue,
          ),
          paquete(
            context,
            'JED-2026-002',
            'María López',
            'San Benito',
            'Pendiente',
            Colors.orange,
          ),
          paquete(
            context,
            'JED-2026-003',
            'José Hernández',
            'Centro de San Salvador',
            'Pendiente',
            Colors.orange,
          ),

          const SizedBox(height: 20),

          const Text(
            'Los paquetes mostrados son datos de prueba.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

Widget resumen(String titulo, String cantidad, IconData icono, Color color) {
  return Card(
    color: Colors.white,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: Color(0xFFE2E8F0)),
    ),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icono, color: color, size: 28),
          const SizedBox(height: 12),
          Text(
            cantidad,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          Text(titulo, style: const TextStyle(color: Color(0xFF64748B))),
        ],
      ),
    ),
  );
}

class DetallePaquete extends StatefulWidget {
  final String guia;
  final String cliente;
  final String direccion;
  final String estado;
  final ValueChanged<String>? onEstadoCambiado;

  const DetallePaquete({
    super.key,
    required this.guia,
    required this.cliente,
    required this.direccion,
    required this.estado,
    this.onEstadoCambiado,
  });

  @override
  State<DetallePaquete> createState() => _DetallePaqueteState();
}

class _DetallePaqueteState extends State<DetallePaquete> {
  late String estadoActual;

  XFile? fotoEntrega;
  DateTime? fechaConfirmacion;
  bool tomandoFoto = false;

  final ImagePicker selectorImagen = ImagePicker();

  @override
  void initState() {
    super.initState();
    estadoActual = widget.estado;
  }

  void cambiarEstado(String nuevoEstado) {
    setState(() {
      estadoActual = nuevoEstado;
    });

    widget.onEstadoCambiado?.call(nuevoEstado);

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Estado actualizado: $nuevoEstado')));
  }

  Future<void> tomarFoto() async {
    if (tomandoFoto) return;

    setState(() {
      tomandoFoto = true;
    });

    try {
      final XFile? imagen = await selectorImagen.pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
        maxWidth: 1600,
      );

      if (!mounted) return;

      if (imagen != null) {
        setState(() {
          fotoEntrega = imagen;
        });
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('No se pudo abrir la cámara: $e')));
    } finally {
      if (mounted) {
        setState(() {
          tomandoFoto = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: azul,
        foregroundColor: Colors.white,
        title: const Text('Detalle del paquete'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Icon(Icons.inventory_2_rounded, size: 72, color: azul),
          const SizedBox(height: 16),
          Text(
            widget.guia,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: azul,
            ),
          ),
          const SizedBox(height: 24),
          detalleFila(Icons.person_outline, 'Destinatario', widget.cliente),
          detalleFila(
            Icons.location_on_outlined,
            'Dirección',
            widget.direccion,
          ),
          detalleFila(
            Icons.local_shipping_outlined,
            'Estado actual',
            estadoActual,
          ),

          const SizedBox(height: 24),

          const Text(
            'Evidencia de entrega',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 12),

          if (fotoEntrega != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(
                File(fotoEntrega!.path),
                height: 230,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            )
          else
            const Text('Todavía no has tomado una fotografía.'),

          const SizedBox(height: 12),

          OutlinedButton.icon(
            onPressed: tomandoFoto ? null : tomarFoto,
            icon: const Icon(Icons.camera_alt),
            label: Text(
              tomandoFoto ? 'Abriendo cámara...' : 'Tomar fotografía',
            ),
          ),

          const SizedBox(height: 24),

          const SizedBox(height: 24),
          const Text(
            'Actualizar estado',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: FilledButton.icon(
              onPressed: estadoActual == 'Pendiente'
                  ? () => cambiarEstado('En camino')
                  : null,
              icon: const Icon(Icons.local_shipping_outlined),
              label: const Text('Marcar en camino'),
              style: FilledButton.styleFrom(
                backgroundColor: azul,
                foregroundColor: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: FilledButton.icon(
              onPressed: estadoActual != 'Entregado'
                  ? () => cambiarEstado('Entregado')
                  : null,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Confirmar entrega'),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.green.shade700,
                foregroundColor: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Volver a las entregas'),
          ),
          const SizedBox(height: 12),
          const Text(
            'Los cambios son temporales y usan datos de prueba.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget detalleFila(IconData icono, String titulo, String valor) {
    return Card(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 14),
      child: ListTile(
        leading: Icon(icono, color: azul, size: 28),
        title: Text(
          titulo,
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 5),
          child: Text(
            valor,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }
}

Widget detalleFila(IconData icono, String titulo, String valor) {
  return Card(
    color: Colors.white,
    elevation: 0,
    margin: const EdgeInsets.only(bottom: 14),
    child: ListTile(
      leading: Icon(icono, color: azul, size: 28),
      title: Text(
        titulo,
        style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Text(
          valor,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    ),
  );
}

class MapaRepartidor extends StatelessWidget {
  final double? latitud;
  final double? longitud;

  const MapaRepartidor({super.key, this.latitud, this.longitud});

  @override
  Widget build(BuildContext context) {
    final bool tieneUbicacion = latitud != null && longitud != null;

    // Centro de prueba en San Salvador si aún no hay GPS.
    const LatLng ubicacionPrueba = LatLng(13.6929, -89.2182);

    final LatLng centro = tieneUbicacion
        ? LatLng(latitud!, longitud!)
        : ubicacionPrueba;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mapa de entregas'),
        backgroundColor: azul,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(initialCenter: centro, initialZoom: 15),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.jedi_express_mobile',
              ),

              if (tieneUbicacion)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: centro,
                      width: 60,
                      height: 60,
                      child: const Icon(
                        Icons.my_location,
                        color: Colors.blue,
                        size: 38,
                      ),
                    ),
                  ],
                ),

              const RichAttributionWidget(
                attributions: [
                  TextSourceAttribution('© OpenStreetMap contributors'),
                ],
              ),
            ],
          ),

          if (!tieneUbicacion)
            Positioned(
              top: 12,
              left: 12,
              right: 12,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    'Vista de prueba en San Salvador. '
                    'Activa el GPS para mostrar tu ubicación real.',
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
              ),
            ),

          if (tieneUbicacion)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(
                    'Tu ubicación GPS\n'
                    'Latitud: ${latitud!.toStringAsFixed(5)}\n'
                    'Longitud: ${longitud!.toStringAsFixed(5)}',
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class PerfilRepartidor extends StatelessWidget {
  const PerfilRepartidor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi perfil'),
        backgroundColor: azul,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 20),
          const Center(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: azul,
              child: Icon(Icons.person, size: 55, color: Colors.white),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text(
              'Roxana',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
          const Center(
            child: Text(
              'Repartidora · JEDi Express',
              style: TextStyle(color: Colors.grey, fontSize: 15),
            ),
          ),
          const SizedBox(height: 30),
          Card(
            child: ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Cargo'),
              subtitle: const Text('Repartidora'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.business_outlined),
              title: const Text('Empresa'),
              subtitle: const Text('JEDi Express'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.info_outline),
              title: const Text('Cuenta'),
              subtitle: const Text('Perfil de demostración'),
            ),
          ),
        ],
      ),
    );
  }
}
