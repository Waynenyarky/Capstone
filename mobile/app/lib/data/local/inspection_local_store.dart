import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path_provider/path_provider.dart';

/// Local SQLite store for inspector offline support.
/// Caches inspection details and queues updates when offline.
class InspectionLocalStore {
  static Database? _db;
  static const String _dbName = 'inspector_offline.db';
  static const int _version = 1;

  static Future<Database> _getDb() async {
    if (_db != null) return _db!;
    final dir = await getApplicationDocumentsDirectory();
    final path = '${dir.path}/$_dbName';
    _db = await openDatabase(path, version: _version, onCreate: _onCreate);
    return _db!;
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE inspection_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE pending_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op_type TEXT NOT NULL,
        inspection_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    ''');
  }

  /// Cache inspection detail for offline access
  static Future<void> cacheInspection(String inspectionId, Map<String, dynamic> data) async {
    final db = await _getDb();
    await db.insert(
      'inspection_cache',
      {
        'id': inspectionId,
        'data': json.encode(data),
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get cached inspection if available
  static Future<Map<String, dynamic>?> getCachedInspection(String inspectionId) async {
    final db = await _getDb();
    final rows = await db.query('inspection_cache', where: 'id = ?', whereArgs: [inspectionId]);
    if (rows.isEmpty) return null;
    try {
      final data = json.decode(rows.first['data'] as String) as Map<String, dynamic>;
      return data;
    } catch (_) {
      return null;
    }
  }

  /// Queue a checklist update for sync when online
  static Future<void> queueChecklistUpdate(String inspectionId, List<dynamic> checklist) async {
    final db = await _getDb();
    await db.insert('pending_sync', {
      'op_type': 'checklist',
      'inspection_id': inspectionId,
      'payload': json.encode({'checklist': checklist}),
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  /// Get all pending sync items
  static Future<List<Map<String, dynamic>>> getPendingSync() async {
    final db = await _getDb();
    final rows = await db.query('pending_sync', orderBy: 'created_at ASC');
    return rows.map((r) {
      return {
        'id': r['id'],
        'op_type': r['op_type'] as String,
        'inspection_id': r['inspection_id'] as String,
        'payload': json.decode(r['payload'] as String) as Map<String, dynamic>,
        'created_at': r['created_at'] as int,
      };
    }).toList();
  }

  /// Remove a pending sync item after successful upload
  static Future<void> removePendingSync(int id) async {
    final db = await _getDb();
    await db.delete('pending_sync', where: 'id = ?', whereArgs: [id]);
  }

  /// Clear all pending sync (e.g. on logout)
  static Future<void> clearPendingSync() async {
    final db = await _getDb();
    await db.delete('pending_sync');
  }

  static Future<void> close() async {
    if (_db != null) {
      await _db!.close();
      _db = null;
    }
  }
}
